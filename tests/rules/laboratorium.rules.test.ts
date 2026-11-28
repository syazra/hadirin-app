import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { after, before, beforeEach, test } from 'node:test';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

const PROJECT_ID = 'demo-hadirin-laboratorium';
const ID_LAB = 'lab-b';

let testEnv: RulesTestEnvironment;

const profil = (
  nama: string,
  nim: string,
  peran: 'ASISTEN' | 'PRAKTIKAN',
  kodePeserta: string,
) => ({
  nama,
  nim,
  email: `${nama.toLowerCase().replace(/\s+/g, '.')}@example.com`,
  peran,
  kodePeserta,
  dibuatPada: new Date(),
});

const labValid = (override: Record<string, unknown> = {}) => ({
  kodeLab: 'LAB-B',
  nama: 'Lab Informatika B',
  lokasiGedung: 'Gedung E Lt. 2',
  latitude: -7.0482375,
  longitude: 110.440765625,
  radiusPresensi: 40,
  aktif: true,
  ...override,
});

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8'),
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await setDoc(
      doc(db, 'pengguna', 'asisten-01'),
      profil('Asisten Satu', '240601000001', 'ASISTEN', 'ASST0001'),
    );
    await setDoc(
      doc(db, 'pengguna', 'praktikan-01'),
      profil('Praktikan Satu', '24060124130088', 'PRAKTIKAN', 'PRKT0001'),
    );
    await setDoc(doc(db, 'laboratorium', ID_LAB), labValid());
  });
});

after(async () => {
  await testEnv?.cleanup();
});

function dbSebagai(uid: string) {
  return testEnv.authenticatedContext(uid, {
    email: `${uid}@example.com`,
  }).firestore();
}

function dbAnonim() {
  return testEnv.unauthenticatedContext().firestore();
}

test('LAB-01: pengguna belum login ditolak membaca maupun menulis laboratorium', async () => {
  const db = dbAnonim();

  await assertFails(getDoc(doc(db, 'laboratorium', ID_LAB)));
  await assertFails(getDocs(collection(db, 'laboratorium')));
  await assertFails(addDoc(collection(db, 'laboratorium'), labValid({ kodeLab: 'LAB-X' })));
  await assertFails(updateDoc(doc(db, 'laboratorium', ID_LAB), { radiusPresensi: 50 }));
  await assertFails(deleteDoc(doc(db, 'laboratorium', ID_LAB)));
});

test('LAB-02: praktikan dan asisten yang sudah login dapat membaca (get & list) laboratorium', async () => {
  const dbPraktikan = dbSebagai('praktikan-01');
  const dbAsisten = dbSebagai('asisten-01');

  await assertSucceeds(getDoc(doc(dbPraktikan, 'laboratorium', ID_LAB)));
  await assertSucceeds(getDocs(collection(dbPraktikan, 'laboratorium')));
  await assertSucceeds(getDoc(doc(dbAsisten, 'laboratorium', ID_LAB)));
  await assertSucceeds(getDocs(collection(dbAsisten, 'laboratorium')));
});

test('LAB-03: asisten dapat membuat dan memperbarui laboratorium dengan schema valid', async () => {
  const db = dbSebagai('asisten-01');

  await assertSucceeds(
    addDoc(
      collection(db, 'laboratorium'),
      labValid({ kodeLab: 'LAB-C', nama: 'Lab Informatika C', radiusPresensi: 55 }),
    ),
  );

  await assertSucceeds(
    updateDoc(doc(db, 'laboratorium', ID_LAB), {
      latitude: -7.049,
      longitude: 110.441,
      radiusPresensi: 60,
      aktif: false,
    }),
  );

  await assertSucceeds(
    updateDoc(doc(db, 'laboratorium', ID_LAB), {
      aktif: true,
    }),
  );
});

test('LAB-04: asisten dapat memperbarui dokumen laboratorium lama yang memiliki field warisan seeder', async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'laboratorium', 'lab-legacy'), {
      idLab: 'lab-legacy',
      kode: 'LEG',
      nama: 'Lab Lama',
      lokasiGedung: 'Gedung E Lt. 1',
      latitude: -7.048,
      longitude: 110.44,
      radiusPresensi: 40,
      aktif: true,
    });
  });

  const db = dbSebagai('asisten-01');

  await assertSucceeds(
    updateDoc(doc(db, 'laboratorium', 'lab-legacy'), {
      kodeLab: 'LEG',
      nama: 'Lab Lama Diperbarui',
      lokasiGedung: 'Gedung E Lt. 1',
      latitude: -7.0485,
      longitude: 110.4405,
      radiusPresensi: 50,
      aktif: true,
    }),
  );
});

test('LAB-05: praktikan ditolak melakukan create, update, maupun delete laboratorium', async () => {
  const db = dbSebagai('praktikan-01');

  await assertFails(addDoc(collection(db, 'laboratorium'), labValid({ kodeLab: 'LAB-P' })));
  await assertFails(updateDoc(doc(db, 'laboratorium', ID_LAB), { radiusPresensi: 100 }));
  await assertFails(deleteDoc(doc(db, 'laboratorium', ID_LAB)));
});

test('LAB-06: asisten dapat menghapus laboratorium sedangkan praktikan ditolak', async () => {
  await assertFails(deleteDoc(doc(dbSebagai('praktikan-01'), 'laboratorium', ID_LAB)));
  await assertSucceeds(deleteDoc(doc(dbSebagai('asisten-01'), 'laboratorium', ID_LAB)));
});

test('LAB-07: validasi schema menolak koordinat/radius/teks/aktif tidak valid serta field tambahan', async () => {
  const db = dbSebagai('asisten-01');

  // Latitude & longitude di luar rentang
  await assertFails(addDoc(collection(db, 'laboratorium'), labValid({ latitude: -91 })));
  await assertFails(addDoc(collection(db, 'laboratorium'), labValid({ latitude: 90.1 })));
  await assertFails(addDoc(collection(db, 'laboratorium'), labValid({ longitude: -181 })));
  await assertFails(addDoc(collection(db, 'laboratorium'), labValid({ longitude: 180.5 })));

  // Radius non-positif atau melebihi batas
  await assertFails(addDoc(collection(db, 'laboratorium'), labValid({ radiusPresensi: 0 })));
  await assertFails(addDoc(collection(db, 'laboratorium'), labValid({ radiusPresensi: -10 })));
  await assertFails(addDoc(collection(db, 'laboratorium'), labValid({ radiusPresensi: 10001 })));

  // Teks kosong / spasi saja / terlalu panjang
  await assertFails(addDoc(collection(db, 'laboratorium'), labValid({ kodeLab: '   ' })));
  await assertFails(addDoc(collection(db, 'laboratorium'), labValid({ kodeLab: 'A'.repeat(33) })));
  await assertFails(addDoc(collection(db, 'laboratorium'), labValid({ nama: '' })));
  await assertFails(addDoc(collection(db, 'laboratorium'), labValid({ lokasiGedung: '   ' })));

  // Aktif bukan boolean
  await assertFails(addDoc(collection(db, 'laboratorium'), labValid({ aktif: 'true' })));

  // Field tambahan di luar schema
  await assertFails(
    addDoc(collection(db, 'laboratorium'), labValid({ fieldLiar: 'tidak-boleh' })),
  );
  await assertFails(
    updateDoc(doc(db, 'laboratorium', ID_LAB), {
      radiusPresensi: 45,
      fieldLiar: 'tidak-boleh',
    }),
  );
});
