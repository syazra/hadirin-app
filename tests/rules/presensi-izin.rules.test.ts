import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

const PROJECT_ID = 'demo-hadirin';
const ID_IZIN = 'sesi-01_praktikan-01';
const ID_SESI = 'sesi-01';
const ID_KELAS = 'kelas-01';

let testEnv: RulesTestEnvironment;

const profil = (peran: string) => ({
  nama: 'Pengguna Test',
  nim: '1234567890',
  email: 'test@example.com',
  peran,
  kodePeserta: 'TEST1234',
  dibuatPada: new Date(),
});

const dataIzin = (statusAi = 'BELUM') => ({
  sesiId: ID_SESI,
  kelasId: ID_KELAS,
  uid: 'praktikan-01',
  alasan: 'Sedang sakit dan perlu istirahat.',
  statusIzin: 'MENUNGGU',
  diperiksaOleh: null,
  waktuPeriksa: null,
  kategoriAi: null,
  statusAi,
  modelAi: null,
  waktuAi: null,
  dibuatPada: new Date(),
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

    await setDoc(doc(db, 'pengguna', 'asisten-01'), profil('ASISTEN'));
    await setDoc(doc(db, 'pengguna', 'asisten-02'), profil('ASISTEN'));
    await setDoc(doc(db, 'pengguna', 'praktikan-01'), profil('PRAKTIKAN'));

    await setDoc(doc(db, 'kelas', ID_KELAS), {
      namaPraktikum: 'Pemrograman',
      asistenUid: 'asisten-01',
      diarsipkan: false,
      dibuatPada: new Date(),
    });

    await setDoc(doc(db, 'sesi', ID_SESI), {
      kelasId: ID_KELAS,
      judul: 'Pertemuan 1',
      lokasi: 'Lab',
      statusSesi: 'DITUTUP',
      diarsipkan: false,
    });

    await setDoc(doc(db, 'izin', ID_IZIN), dataIzin());
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

async function putuskan(
  uid: string,
  status: 'DISETUJUI' | 'DITOLAK',
) {
  const db = dbSebagai(uid);

  return updateDoc(doc(db, 'izin', ID_IZIN), {
    statusIzin: status,
    diperiksaOleh: uid,
    waktuPeriksa: serverTimestamp(),
  });
}

test('B07-01: asisten pemilik dapat menyetujui izin', async () => {
  await assertSucceeds(putuskan('asisten-01', 'DISETUJUI'));
});

test('B07-02: asisten pemilik dapat menolak izin', async () => {
  await assertSucceeds(putuskan('asisten-01', 'DITOLAK'));
});

test('B07-03: praktikan tidak boleh memutuskan izin', async () => {
  await assertFails(putuskan('praktikan-01', 'DISETUJUI'));
});

test('B07-04: asisten kelas lain tidak boleh memutuskan izin', async () => {
  await assertFails(putuskan('asisten-02', 'DISETUJUI'));
});

test('B07-05: keputusan kedua harus ditolak', async () => {
  await assertSucceeds(putuskan('asisten-01', 'DISETUJUI'));
  await assertFails(putuskan('asisten-01', 'DITOLAK'));
});

test('B07-06: status keputusan selain DISETUJUI atau DITOLAK ditolak', async () => {
  const db = dbSebagai('asisten-01');

  await assertFails(
    updateDoc(doc(db, 'izin', ID_IZIN), {
      statusIzin: 'MENUNGGU',
      diperiksaOleh: 'asisten-01',
      waktuPeriksa: serverTimestamp(),
    }),
  );
});

test('B07-07: UID pemeriksa harus sesuai akun login', async () => {
  const db = dbSebagai('asisten-01');

  await assertFails(
    updateDoc(doc(db, 'izin', ID_IZIN), {
      statusIzin: 'DISETUJUI',
      diperiksaOleh: 'asisten-02',
      waktuPeriksa: serverTimestamp(),
    }),
  );
});

test('B07-08: waktu pemeriksaan harus berasal dari server', async () => {
  const db = dbSebagai('asisten-01');

  await assertFails(
    updateDoc(doc(db, 'izin', ID_IZIN), {
      statusIzin: 'DISETUJUI',
      diperiksaOleh: 'asisten-01',
      waktuPeriksa: new Date('2026-01-01T00:00:00Z'),
    }),
  );
});

test('B07-09: perubahan field tambahan saat keputusan ditolak', async () => {
  const db = dbSebagai('asisten-01');

  await assertFails(
    updateDoc(doc(db, 'izin', ID_IZIN), {
      statusIzin: 'DISETUJUI',
      diperiksaOleh: 'asisten-01',
      waktuPeriksa: serverTimestamp(),
      alasan: 'Alasan diubah oleh asisten',
    }),
  );
});

test('B07-10: AI gagal tidak menghalangi keputusan manual', async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(context.firestore(), 'izin', ID_IZIN),
      dataIzin('GAGAL'),
    );
  });

  await assertSucceeds(putuskan('asisten-01', 'DISETUJUI'));
});

test('B07-11: keputusan menyimpan UID pemeriksa dan waktu server', async () => {
  await assertSucceeds(putuskan('asisten-01', 'DISETUJUI'));

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const snapshot = await getDoc(
      doc(context.firestore(), 'izin', ID_IZIN),
    );

    assert.equal(snapshot.data()?.statusIzin, 'DISETUJUI');
    assert.equal(snapshot.data()?.diperiksaOleh, 'asisten-01');
    assert.ok(snapshot.data()?.waktuPeriksa);
  });
});
