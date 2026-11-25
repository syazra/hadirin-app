const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function transpile(relativePath) {
  const source = fs.readFileSync(path.join(__dirname, '../../src', relativePath), 'utf8');
  return ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
}

const qrPayload = {};
vm.runInNewContext(transpile('utils/qr-payload.ts'), { exports: qrPayload });
const serviceSource = transpile('services/presensi-service.ts');

function siapkanLayanan(respond, envOverride = {}, currentUser = { uid: 'praktikan-01' }) {
  const exports = {};
  const imports = {
    '@react-native-firebase/auth': { getIdToken: async () => 'id-token-uji' },
    '@react-native-firebase/firestore': {
      collection: () => ({}),
      doc: () => ({}),
      getDoc: async () => ({ exists: () => false }),
      onSnapshot: () => () => {},
      query: () => ({}),
      where: () => ({}),
    },
    '@/lib/firebase': {
      isFirebaseAvailable: true,
      getFirebaseServices: () => ({
        auth: { currentUser },
        db: {},
      }),
    },
    '@/utils/qr-payload': qrPayload,
  };

  vm.runInNewContext(serviceSource, {
    exports,
    AbortController,
    setTimeout,
    clearTimeout,
    process: {
      env: {
        EXPO_PUBLIC_GEMINI_PROXY_URL: 'https://proxy.example/',
        ...envOverride,
      },
    },
    fetch: respond,
    require: (name) => imports[name],
  });

  return exports.catatPresensiDariQr;
}

function posisiValid(override = {}) {
  return {
    latitude: -7.04825,
    longitude: 110.44078,
    accuracy: 12,
    timestamp: Date.now() - 2_000,
    ...override,
  };
}

const QR_VALID = 'hadirin:sesi-01:0123456789abcdef0123456789abcdef';

test('mengirim Bearer token + metadata GPS ke /api/presensi dan mengembalikan Presensi', async () => {
  const waktuIso = '2026-11-25T08:00:00.000Z';
  const posisi = posisiValid();
  let capturedUrl = '';
  let capturedOptions = null;

  const catatPresensiDariQr = siapkanLayanan(async (url, options) => {
    capturedUrl = url;
    capturedOptions = options;
    return Response.json({
      ok: true,
      data: {
        idPresensi: 'sesi-01_praktikan-01',
        sesiId: 'sesi-01',
        kelasId: 'kelas-01',
        uid: 'praktikan-01',
        jarakMeter: 4.5,
        radiusPresensi: 40,
        waktuHadirIso: waktuIso,
      },
    });
  });

  const hasil = await catatPresensiDariQr(QR_VALID, posisi);
  assert.equal(capturedUrl, 'https://proxy.example/api/presensi');
  assert.equal(capturedOptions.method, 'POST');
  assert.equal(capturedOptions.headers.Authorization, 'Bearer id-token-uji');
  assert.deepEqual(JSON.parse(capturedOptions.body), {
    sesiId: 'sesi-01',
    buktiQr: QR_VALID,
    koordinat: { latitude: posisi.latitude, longitude: posisi.longitude },
    akurasi: posisi.accuracy,
    timestamp: posisi.timestamp,
  });

  assert.equal(hasil.ok, true);
  assert.equal(hasil.data.idPresensi, 'sesi-01_praktikan-01');
  assert.equal(hasil.data.kelasId, 'kelas-01');
  assert.equal(hasil.data.waktuHadir.toISOString(), waktuIso);
});

test('memprioritaskan EXPO_PUBLIC_ATTENDANCE_API_URL bila diatur', async () => {
  let capturedUrl = '';
  const catatPresensiDariQr = siapkanLayanan(
    async (url) => {
      capturedUrl = url;
      return Response.json({
        ok: true,
        data: {
          idPresensi: 'sesi-01_praktikan-01',
          sesiId: 'sesi-01',
          kelasId: 'kelas-01',
          uid: 'praktikan-01',
          waktuHadirIso: '2026-11-25T08:00:00.000Z',
        },
      });
    },
    { EXPO_PUBLIC_ATTENDANCE_API_URL: 'https://attendance.example/' },
  );

  const hasil = await catatPresensiDariQr(QR_VALID, posisiValid());
  assert.equal(hasil.ok, true);
  assert.equal(capturedUrl, 'https://attendance.example/api/presensi');
});

test('menolak QR invalid, GPS kosong, akurasi rendah, dan lokasi stale tanpa memanggil fetch', async () => {
  let fetchCalled = false;
  const catatPresensiDariQr = siapkanLayanan(async () => {
    fetchCalled = true;
    return Response.json({ ok: true, data: {} });
  });

  const qrSalah = await catatPresensiDariQr('bukan-qr', posisiValid());
  assert.equal(qrSalah.ok, false);
  assert.equal(qrSalah.alasan, 'QR_TIDAK_VALID');

  const tanpaPosisi = await catatPresensiDariQr(QR_VALID, null);
  assert.equal(tanpaPosisi.ok, false);
  assert.equal(tanpaPosisi.alasan, 'INPUT_TIDAK_VALID');

  const akurasiBuruk = await catatPresensiDariQr(QR_VALID, posisiValid({ accuracy: 75 }));
  assert.equal(akurasiBuruk.ok, false);
  assert.equal(akurasiBuruk.alasan, 'INPUT_TIDAK_VALID');

  const lokasiStale = await catatPresensiDariQr(
    QR_VALID,
    posisiValid({ timestamp: Date.now() - 45_000 }),
  );
  assert.equal(lokasiStale.ok, false);
  assert.equal(lokasiStale.alasan, 'INPUT_TIDAK_VALID');
  assert.match(lokasiStale.pesan, /kedaluwarsa/);

  assert.equal(fetchCalled, false);
});

test('meneruskan error terstruktur dari backend presensi', async () => {
  for (const [status, alasan, pesan] of [
    [422, 'INPUT_TIDAK_VALID', 'Anda berada di luar area laboratorium (95 m dari titik pusat, batas 40 m).'],
    [409, 'SUDAH_PRESENSI', 'Anda sudah tercatat hadir pada sesi ini.'],
    [422, 'QR_TIDAK_VALID', 'Kode QR tidak valid.'],
    [409, 'ADA_IZIN', 'Ada izin aktif.'],
    [409, 'BELUM_DIBUKA', 'Sesi belum dibuka.'],
  ]) {
    const catatPresensiDariQr = siapkanLayanan(async () =>
      Response.json({ ok: false, alasan, pesan }, { status }),
    );
    const hasil = await catatPresensiDariQr(QR_VALID, posisiValid());
    assert.equal(hasil.ok, false);
    assert.equal(hasil.alasan, alasan);
    assert.equal(hasil.pesan, pesan);
  }
});

test('memetakan gangguan jaringan (TypeError) menjadi JARINGAN dan AbortError menjadi TIMEOUT', async () => {
  const catatNetworkErr = siapkanLayanan(async () => {
    throw new TypeError('Network request failed');
  });
  const hasilJaringan = await catatNetworkErr(QR_VALID, posisiValid());
  assert.equal(hasilJaringan.ok, false);
  assert.equal(hasilJaringan.alasan, 'JARINGAN');

  const catatTimeout = siapkanLayanan(async () => {
    const err = new Error('The operation was aborted');
    err.name = 'AbortError';
    throw err;
  });
  const hasilTimeout = await catatTimeout(QR_VALID, posisiValid());
  assert.equal(hasilTimeout.ok, false);
  assert.equal(hasilTimeout.alasan, 'TIMEOUT');
});
