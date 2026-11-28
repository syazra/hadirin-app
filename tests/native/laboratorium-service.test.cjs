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

const constantsSource = transpile('constants/laboratorium.ts');
const serviceSource = transpile('services/laboratorium-service.ts');

function loadModule(code, imports) {
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    require: (name) => {
      if (!(name in imports)) {
        throw new Error(`Module tidak dimock: ${name}`);
      }
      return imports[name];
    },
  });
  return exports;
}

const constantsExports = loadModule(constantsSource, {});

function siapkanLayanan(overrides = {}) {
  const addCalls = [];
  const updateCalls = [];
  const deleteCalls = [];

  const docsByCollection = {
    laboratorium: overrides.laboratoriumDocs ?? [],
    kelas: overrides.kelasDocs ?? [],
    sesi: overrides.sesiDocs ?? [],
    pengguna: overrides.penggunaDocs ?? [
      { id: 'asisten-01', data: { peran: 'ASISTEN' } },
    ],
  };

  const firestoreMock = {
    collection: (_db, name) => ({ __collection: name }),
    doc: (_db, name, id) => ({ __doc: `${name}/${id}` }),
    query: (col, ...filters) => ({
      ...col,
      __filters: filters.map((filter) => filter.__where),
    }),
    orderBy: (field) => ({ __orderBy: field }),
    where: (field, op, value) => ({ __where: [field, op, value] }),
    getDocs: async (q) => {
      const colName = q?.__collection;
      const filters = q?.__filters ?? [];
      const rawDocs = (docsByCollection[colName] ?? []).filter((item) =>
        filters.every(([field, op, value]) => op !== '==' || item.data?.[field] === value),
      );
      return {
        docs: rawDocs.map((item) => ({
          id: item.id,
          data: () => item.data,
        })),
      };
    },
    getDoc: async (docRef) => {
      const [, id] = String(docRef?.__doc ?? '').split('/');
      const item = docsByCollection.pengguna.find((docItem) => docItem.id === id);
      return {
        exists: () => Boolean(item),
        data: () => item?.data,
      };
    },
    addDoc: async (colRef, payload) => {
      if (overrides.addError) throw overrides.addError;
      addCalls.push({ colRef, payload });
      return { id: 'lab-baru-01' };
    },
    updateDoc: async (docRef, payload) => {
      if (overrides.updateError) throw overrides.updateError;
      updateCalls.push({ docRef, payload });
    },
    deleteDoc: async (docRef) => {
      if (overrides.deleteError) throw overrides.deleteError;
      deleteCalls.push({ docRef });
    },
  };

  const exports = loadModule(serviceSource, {
    '@react-native-firebase/firestore': firestoreMock,
    '@/constants/laboratorium': constantsExports,
    '@/lib/firebase': {
      isFirebaseAvailable: overrides.isFirebaseAvailable ?? true,
      getFirebaseServices: () => ({
        db: {},
        auth: { currentUser: overrides.currentUser ?? { uid: 'asisten-01' } },
      }),
    },
  });

  return { exports, addCalls, updateCalls, deleteCalls };
}

function inputValid(override = {}) {
  return {
    kodeLab: '  lab-b ',
    nama: '  Lab Informatika B  ',
    lokasiGedung: '  Gedung E Lt. 2  ',
    latitude: -7.0482375,
    longitude: 110.440765625,
    radiusPresensi: 40,
    aktif: true,
    ...override,
  };
}

test('tambahLaboratorium dan ubahLaboratorium mengirim tepat 7 field kanonik yang rapi', async () => {
  const { exports, addCalls, updateCalls } = siapkanLayanan();

  const hasilTambah = await exports.tambahLaboratorium({
    ...inputValid(),
    fieldLiar: 'harus-diabaikan',
  });
  assert.equal(hasilTambah.ok, true);
  assert.equal(hasilTambah.data, 'lab-baru-01');
  assert.deepEqual({ ...addCalls[0].payload }, {
    kodeLab: 'LAB-B',
    nama: 'Lab Informatika B',
    lokasiGedung: 'Gedung E Lt. 2',
    latitude: -7.0482375,
    longitude: 110.440765625,
    radiusPresensi: 40,
    aktif: true,
  });

  const hasilUbah = await exports.ubahLaboratorium(
    'lab-b',
    inputValid({ aktif: false, radiusPresensi: 60 }),
  );
  assert.equal(hasilUbah.ok, true);
  assert.deepEqual(updateCalls[0].docRef, { __doc: 'laboratorium/lab-b' });
  assert.deepEqual({ ...updateCalls[0].payload }, {
    kodeLab: 'LAB-B',
    nama: 'Lab Informatika B',
    lokasiGedung: 'Gedung E Lt. 2',
    latitude: -7.0482375,
    longitude: 110.440765625,
    radiusPresensi: 60,
    aktif: false,
  });
});

test('menolak kodeLab duplikat saat tambah maupun ubah ke kode laboratorium lain', async () => {
  const { exports, addCalls, updateCalls } = siapkanLayanan({
    laboratoriumDocs: [
      { id: 'lab-existing', data: { kodeLab: 'LAB-B' } },
    ],
  });

  const hasilTambah = await exports.tambahLaboratorium(inputValid());
  assert.equal(hasilTambah.ok, false);
  assert.equal(hasilTambah.alasan, 'INPUT_TIDAK_VALID');
  assert.equal(addCalls.length, 0);

  // Ubah lab lain menjadi LAB-B ditolak
  const hasilUbahKonflik = await exports.ubahLaboratorium('lab-lain', inputValid());
  assert.equal(hasilUbahKonflik.ok, false);
  assert.equal(hasilUbahKonflik.alasan, 'INPUT_TIDAK_VALID');
  assert.equal(updateCalls.length, 0);

  // Ubah lab-existing dengan kodenya sendiri tetap diizinkan
  const hasilUbahSendiri = await exports.ubahLaboratorium('lab-existing', inputValid());
  assert.equal(hasilUbahSendiri.ok, true);
  assert.equal(updateCalls.length, 1);
});

test('validasi klien menolak teks kosong/terlalu panjang, koordinat/radius di luar batas, dan aktif non-boolean', async () => {
  const { exports, addCalls } = siapkanLayanan();

  const kasusInvalid = [
    inputValid({ kodeLab: '   ' }),
    inputValid({ kodeLab: 'X'.repeat(33) }),
    inputValid({ nama: 'A'.repeat(101) }),
    inputValid({ lokasiGedung: 'G'.repeat(201) }),
    inputValid({ latitude: -90.5 }),
    inputValid({ latitude: 95 }),
    inputValid({ longitude: -181 }),
    inputValid({ longitude: 181 }),
    inputValid({ radiusPresensi: 0 }),
    inputValid({ radiusPresensi: -5 }),
    inputValid({ radiusPresensi: 10001 }),
    inputValid({ aktif: 'true' }),
  ];

  for (const data of kasusInvalid) {
    const hasil = await exports.tambahLaboratorium(data);
    assert.equal(hasil.ok, false);
    assert.equal(hasil.alasan, 'INPUT_TIDAK_VALID');
  }

  assert.equal(addCalls.length, 0);
});

test('hapusLaboratorium melindungi relasi kelas/sesi aktif dan mengizinkan hapus jika hanya relasi arsip/ditutup', async () => {
  // Masih ada kelas aktif -> ditolak
  const denganKelasAktif = siapkanLayanan({
    kelasDocs: [{ id: 'kls-1', data: { labId: 'lab-b', diarsipkan: false } }],
  });
  const gagalKelas = await denganKelasAktif.exports.hapusLaboratorium('lab-b');
  assert.equal(gagalKelas.ok, false);
  assert.equal(gagalKelas.alasan, 'INPUT_TIDAK_VALID');
  assert.equal(denganKelasAktif.deleteCalls.length, 0);

  // Masih ada sesi dibuka/belum dibuka -> ditolak
  const denganSesiAktif = siapkanLayanan({
    sesiDocs: [{ id: 'sesi-1', data: { labId: 'lab-b', diarsipkan: false, statusSesi: 'BELUM_DIBUKA' } }],
  });
  const gagalSesi = await denganSesiAktif.exports.hapusLaboratorium('lab-b');
  assert.equal(gagalSesi.ok, false);
  assert.equal(gagalSesi.alasan, 'INPUT_TIDAK_VALID');
  assert.equal(denganSesiAktif.deleteCalls.length, 0);

  // Hanya kelas arsip & sesi DITUTUP -> berhasil dihapus
  const amanDihapus = siapkanLayanan({
    kelasDocs: [{ id: 'kls-arsip', data: { labId: 'lab-b', diarsipkan: true } }],
    sesiDocs: [{ id: 'sesi-lama', data: { labId: 'lab-b', diarsipkan: false, statusSesi: 'DITUTUP' } }],
  });
  const suksesHapus = await amanDihapus.exports.hapusLaboratorium('lab-b');
  assert.equal(suksesHapus.ok, true);
  assert.deepEqual(amanDihapus.deleteCalls[0].docRef, { __doc: 'laboratorium/lab-b' });
});

test('hapusLaboratorium menolak akun praktikan dan menghitung kelas aktif lintas-asisten', async () => {
  const akunPraktikan = siapkanLayanan({
    penggunaDocs: [
      { id: 'praktikan-01', data: { peran: 'PRAKTIKAN' } },
    ],
    currentUser: { uid: 'praktikan-01' },
    deleteError: Object.assign(new Error('Permission denied'), {
      code: 'firestore/permission-denied',
    }),
  });
  const gagalPraktikan = await akunPraktikan.exports.hapusLaboratorium('lab-b');
  assert.equal(gagalPraktikan.ok, false);
  assert.equal(gagalPraktikan.alasan, 'TIDAK_BERWENANG');
  assert.equal(akunPraktikan.deleteCalls.length, 0);

  const kelasAsistenLain = siapkanLayanan({
    kelasDocs: [
      {
        id: 'kls-asisten-lain',
        data: { labId: 'lab-b', diarsipkan: false, asistenUid: 'asisten-02' },
      },
    ],
  });
  const gagalLintasAsisten = await kelasAsistenLain.exports.hapusLaboratorium('lab-b');
  assert.equal(gagalLintasAsisten.ok, false);
  assert.equal(gagalLintasAsisten.alasan, 'INPUT_TIDAK_VALID');
  assert.equal(kelasAsistenLain.deleteCalls.length, 0);
});

test('memetakan firestore/permission-denied menjadi TIDAK_BERWENANG', async () => {
  const err = Object.assign(new Error('Permission denied'), { code: 'firestore/permission-denied' });
  const { exports } = siapkanLayanan({ addError: err, updateError: err, deleteError: err });

  const hasilTambah = await exports.tambahLaboratorium(inputValid());
  assert.equal(hasilTambah.ok, false);
  assert.equal(hasilTambah.alasan, 'TIDAK_BERWENANG');

  const hasilUbah = await exports.ubahLaboratorium('lab-b', inputValid());
  assert.equal(hasilUbah.ok, false);
  assert.equal(hasilUbah.alasan, 'TIDAK_BERWENANG');

  const hasilHapus = await exports.hapusLaboratorium('lab-b');
  assert.equal(hasilHapus.ok, false);
  assert.equal(hasilHapus.alasan, 'TIDAK_BERWENANG');
});