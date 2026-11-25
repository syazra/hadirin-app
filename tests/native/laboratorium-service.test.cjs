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

const serviceSource = transpile('services/laboratorium-service.ts');

function siapkanLayanan(overrides = {}) {
  const exports = {};
  const addCalls = [];
  const updateCalls = [];

  const firestoreMock = {
    collection: (_db, name) => ({ __collection: name }),
    doc: (_db, name, id) => ({ __doc: `${name}/${id}` }),
    query: (col) => col,
    orderBy: (field) => ({ __orderBy: field }),
    getDocs: async () => ({ docs: [] }),
    addDoc: async (colRef, payload) => {
      if (overrides.addError) throw overrides.addError;
      addCalls.push({ colRef, payload });
      return { id: 'lab-baru-01' };
    },
    updateDoc: async (docRef, payload) => {
      if (overrides.updateError) throw overrides.updateError;
      updateCalls.push({ docRef, payload });
    },
  };

  const imports = {
    '@react-native-firebase/firestore': firestoreMock,
    '@/lib/firebase': {
      isFirebaseAvailable: overrides.isFirebaseAvailable ?? true,
      getFirebaseServices: () => ({ db: {} }),
    },
  };

  vm.runInNewContext(serviceSource, {
    exports,
    require: (name) => imports[name],
  });

  return { exports, addCalls, updateCalls };
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

test('tidak mengekspor hapusLaboratorium (soft-deactivate saja)', () => {
  const { exports } = siapkanLayanan();
  assert.equal('hapusLaboratorium' in exports, false);
});

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

  const hasilUbah = await exports.ubahLaboratorium('lab-b', inputValid({ aktif: false, radiusPresensi: 60 }));
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

test('memetakan firestore/permission-denied menjadi TIDAK_BERWENANG', async () => {
  const err = Object.assign(new Error('Permission denied'), { code: 'firestore/permission-denied' });
  const { exports } = siapkanLayanan({ addError: err, updateError: err });

  const hasilTambah = await exports.tambahLaboratorium(inputValid());
  assert.equal(hasilTambah.ok, false);
  assert.equal(hasilTambah.alasan, 'TIDAK_BERWENANG');

  const hasilUbah = await exports.ubahLaboratorium('lab-b', inputValid());
  assert.equal(hasilUbah.ok, false);
  assert.equal(hasilUbah.alasan, 'TIDAK_BERWENANG');
});
