import assert from 'node:assert/strict';
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
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

const PROJECT_ID = 'demo-hadirin';
const ID_IZIN = 'sesi-01_praktikan-01';
const ID_SESI = 'sesi-01';
const ID_KELAS = 'kelas-01';
const KODE_QR_VALID = '0123456789abcdef0123456789abcdef';

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
      waktuMulai: new Date(),
      waktuSelesai: null,
      statusSesi: 'DITUTUP',
      diarsipkan: false,
    });
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

async function siapkanIzinAwal(statusAi = 'BELUM') {
  await siapkanDataPresensiIzin();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(context.firestore(), 'izin', ID_IZIN),
      dataIzin(statusAi),
    );
  });
}

async function siapkanDataPresensiIzin(
  opsi: {
    statusSesi?: string;
    statusAnggota?: string;
    diarsipkan?: boolean;
    statusIzin?: string | null;
    sudahPresensi?: boolean;
  } = {},
) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await setDoc(doc(db, 'sesi', ID_SESI), {
      kelasId: ID_KELAS,
      judul: 'Pertemuan 1',
      lokasi: 'Lab',
      waktuMulai: new Date(),
      waktuSelesai: null,
      statusSesi: opsi.statusSesi ?? 'DIBUKA',
      diarsipkan: opsi.diarsipkan ?? false,
    });

    await setDoc(doc(db, 'kelas', ID_KELAS), {
      namaPraktikum: 'Pemrograman',
      asistenUid: 'asisten-01',
      diarsipkan: opsi.diarsipkan ?? false,
      dibuatPada: new Date(),
    });

    await setDoc(
      doc(db, 'keanggotaan', `${ID_KELAS}_praktikan-01`),
      {
        kelasId: ID_KELAS,
        uid: 'praktikan-01',
        nama: 'Praktikan Test',
        nim: '1234567890',
        status: opsi.statusAnggota ?? 'AKTIF',
      },
    );

    const KODE_QR_VALID = '0123456789abcdef0123456789abcdef';
    await setDoc(
      doc(db, 'sesi', ID_SESI, 'rahasia', 'qr'),
      { kodeQr: KODE_QR_VALID },
    );

    if (opsi.statusIzin) {
      await setDoc(doc(db, 'izin', ID_IZIN), {
        ...dataIzin(),
        statusIzin: opsi.statusIzin,
      });
    } else {
      await deleteDoc(doc(db, 'izin', ID_IZIN));
    }

    if (opsi.sudahPresensi) {
      await setDoc(doc(db, 'presensi', ID_IZIN), {
        sesiId: ID_SESI,
        kelasId: ID_KELAS,
        uid: 'praktikan-01',
        waktuHadir: new Date(),
        kodeQr: KODE_QR_VALID,
      });
    }
  });
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

// ==========================================
// B07 — PEMERIKSAAN IZIN OLEH ASISTEN
// ==========================================

test('B07-01: asisten pemilik dapat menyetujui izin', async () => {
  await siapkanIzinAwal();
  await assertSucceeds(putuskan('asisten-01', 'DISETUJUI'));
});

test('B07-02: asisten pemilik dapat menolak izin', async () => {
  await siapkanIzinAwal();
  await assertSucceeds(putuskan('asisten-01', 'DITOLAK'));
});

test('B07-03: praktikan tidak boleh memutuskan izin', async () => {
  await siapkanIzinAwal();
  await assertFails(putuskan('praktikan-01', 'DISETUJUI'));
});

test('B07-04: asisten kelas lain tidak boleh memutuskan izin', async () => {
  await siapkanIzinAwal();
  await assertFails(putuskan('asisten-02', 'DISETUJUI'));
});

test('B07-05: keputusan kedua harus ditolak', async () => {
  await siapkanIzinAwal();
  await assertSucceeds(putuskan('asisten-01', 'DISETUJUI'));
  await assertFails(putuskan('asisten-01', 'DITOLAK'));
});

test('B07-06: status keputusan selain DISETUJUI atau DITOLAK ditolak', async () => {
  const db = dbSebagai('asisten-01');

  await siapkanIzinAwal();
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

  await siapkanIzinAwal();
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

  await siapkanIzinAwal();
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

  await siapkanIzinAwal();
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
  await siapkanIzinAwal();
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

// ==========================================
// B04 — PRESENSI DAN RIWAYAT
// ==========================================

test('B04-01: praktikan aktif dapat membuat presensi sendiri', async () => {
  await siapkanDataPresensiIzin();

  const db = dbSebagai('praktikan-01');

  await assertSucceeds(
    setDoc(doc(db, 'presensi', ID_IZIN), {
      sesiId: ID_SESI,
      kelasId: ID_KELAS,
      uid: 'praktikan-01',
      waktuHadir: serverTimestamp(),
      kodeQr: KODE_QR_VALID,
    }),
  );
});

test('B04-02: presensi dengan UID orang lain ditolak', async () => {
  await siapkanDataPresensiIzin();

  const db = dbSebagai('praktikan-01');

  await assertFails(
    setDoc(doc(db, 'presensi', ID_IZIN), {
      sesiId: ID_SESI,
      kelasId: ID_KELAS,
      uid: 'praktikan-lain',
      waktuHadir: serverTimestamp(),
      kodeQr: KODE_QR_VALID,
    }),
  );
});

test('B04-03: presensi pada sesi yang belum dibuka ditolak', async () => {
  await siapkanDataPresensiIzin({ statusSesi: 'BELUM_DIBUKA' });

  const db = dbSebagai('praktikan-01');

  await assertFails(
    setDoc(doc(db, 'presensi', ID_IZIN), {
      sesiId: ID_SESI,
      kelasId: ID_KELAS,
      uid: 'praktikan-01',
      waktuHadir: serverTimestamp(),
      kodeQr: KODE_QR_VALID,
    }),
  );
});

test('B04-04: presensi pada sesi yang sudah ditutup ditolak', async () => {
  await siapkanDataPresensiIzin({ statusSesi: 'DITUTUP' });

  const db = dbSebagai('praktikan-01');

  await assertFails(
    setDoc(doc(db, 'presensi', ID_IZIN), {
      sesiId: ID_SESI,
      kelasId: ID_KELAS,
      uid: 'praktikan-01',
      waktuHadir: serverTimestamp(),
      kodeQr: KODE_QR_VALID,
    }),
  );
});

test('B04-05: anggota nonaktif tidak dapat melakukan presensi', async () => {
  await siapkanDataPresensiIzin({ statusAnggota: 'NONAKTIF' });

  const db = dbSebagai('praktikan-01');

  await assertFails(
    setDoc(doc(db, 'presensi', ID_IZIN), {
      sesiId: ID_SESI,
      kelasId: ID_KELAS,
      uid: 'praktikan-01',
      waktuHadir: serverTimestamp(),
      kodeQr: KODE_QR_VALID,
    }),
  );
});

test('B04-06: presensi kedua pada sesi yang sama ditolak', async () => {
  await siapkanDataPresensiIzin({ sudahPresensi: true });

  const db = dbSebagai('praktikan-01');

  await assertFails(
    setDoc(doc(db, 'presensi', ID_IZIN), {
      sesiId: ID_SESI,
      kelasId: ID_KELAS,
      uid: 'praktikan-01',
      waktuHadir: serverTimestamp(),
      kodeQr: KODE_QR_VALID,
    }),
  );
});

test('B04-07: presensi saat izin masih MENUNGGU ditolak', async () => {
  await siapkanDataPresensiIzin({ statusIzin: 'MENUNGGU' });

  const db = dbSebagai('praktikan-01');

  await assertFails(
    setDoc(doc(db, 'presensi', ID_IZIN), {
      sesiId: ID_SESI,
      kelasId: ID_KELAS,
      uid: 'praktikan-01',
      waktuHadir: serverTimestamp(),
      kodeQr: KODE_QR_VALID,
    }),
  );
});

test('B04-08: presensi saat izin DISETUJUI ditolak', async () => {
  await siapkanDataPresensiIzin({ statusIzin: 'DISETUJUI' });

  const db = dbSebagai('praktikan-01');

  await assertFails(
    setDoc(doc(db, 'presensi', ID_IZIN), {
      sesiId: ID_SESI,
      kelasId: ID_KELAS,
      uid: 'praktikan-01',
      waktuHadir: serverTimestamp(),
      kodeQr: KODE_QR_VALID,
    }),
  );
});

test('B04-09: izin DITOLAK tidak menghalangi presensi', async () => {
  await siapkanDataPresensiIzin({ statusIzin: 'DITOLAK' });

  const db = dbSebagai('praktikan-01');

  await assertSucceeds(
    setDoc(doc(db, 'presensi', ID_IZIN), {
      sesiId: ID_SESI,
      kelasId: ID_KELAS,
      uid: 'praktikan-01',
      waktuHadir: serverTimestamp(),
      kodeQr: KODE_QR_VALID,
    }),
  );
});

test('B04-10: praktikan tidak dapat membaca dokumen rahasia QR', async () => {
  await siapkanDataPresensiIzin();

  const db = dbSebagai('praktikan-01');

  await assertFails(
    getDoc(doc(db, 'sesi', ID_SESI, 'rahasia', 'qr')),
  );
});

test('B04-11: praktikan tidak dapat membaca riwayat akun lain', async () => {
  await siapkanDataPresensiIzin();

  const db = dbSebagai('praktikan-01');

  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(context.firestore(), 'presensi', 'sesi-01_praktikan-lain'),
      {
        sesiId: ID_SESI,
        kelasId: ID_KELAS,
        uid: 'praktikan-lain',
        waktuHadir: new Date(),
        kodeQr: KODE_QR_VALID,
      },
    );
  });

  await assertFails(
    getDoc(doc(db, 'presensi', 'sesi-01_praktikan-lain')),
  );
});

test('B04-12: presensi dengan kode QR salah ditolak', async () => {
  await siapkanDataPresensiIzin();

  const db = dbSebagai('praktikan-01');

  await assertFails(
    setDoc(doc(db, 'presensi', ID_IZIN), {
      sesiId: ID_SESI,
      kelasId: ID_KELAS,
      uid: 'praktikan-01',
      waktuHadir: serverTimestamp(),
      kodeQr: 'fedcba9876543210fedcba9876543210',
    }),
  );
});

test('B04-13: presensi pada kelas atau sesi yang diarsipkan ditolak', async () => {
  await siapkanDataPresensiIzin({ diarsipkan: true });

  const db = dbSebagai('praktikan-01');

  await assertFails(
    setDoc(doc(db, 'presensi', ID_IZIN), {
      sesiId: ID_SESI,
      kelasId: ID_KELAS,
      uid: 'praktikan-01',
      waktuHadir: serverTimestamp(),
      kodeQr: KODE_QR_VALID,
    }),
  );
});

test('B04-14: batch presensi dan izin MENUNGGU bersamaan ditolak', async () => {
  await siapkanDataPresensiIzin();

  const db = dbSebagai('praktikan-01');
  const batch = writeBatch(db);

  batch.set(doc(db, 'presensi', ID_IZIN), {
    sesiId: ID_SESI,
    kelasId: ID_KELAS,
    uid: 'praktikan-01',
    waktuHadir: serverTimestamp(),
    kodeQr: KODE_QR_VALID,
  });

  batch.set(doc(db, 'izin', ID_IZIN), {
    ...dataIzin(),
    dibuatPada: serverTimestamp(),
  });

  await assertFails(batch.commit());
});

// ==========================================
// B06 — PENGAJUAN IZIN
// ==========================================

test('B06-01: praktikan aktif dapat mengajukan izin', async () => {
  await siapkanDataPresensiIzin();

  const db = dbSebagai('praktikan-01');

  await assertSucceeds(
    setDoc(doc(db, 'izin', ID_IZIN), {
      ...dataIzin(),
      dibuatPada: serverTimestamp(),
    }),
  );
});

test('B06-02: pengajuan izin dengan UID orang lain ditolak', async () => {
  await siapkanDataPresensiIzin();

  const db = dbSebagai('praktikan-01');

  await assertFails(
    setDoc(doc(db, 'izin', ID_IZIN), {
      ...dataIzin(),
      uid: 'praktikan-lain',
      dibuatPada: serverTimestamp(),
    }),
  );
});

test('B06-03: asisten tidak dapat mengajukan izin sebagai praktikan', async () => {
  await siapkanDataPresensiIzin();

  const db = dbSebagai('asisten-01');

  await assertFails(
    setDoc(doc(db, 'izin', ID_IZIN), {
      ...dataIzin(),
      uid: 'asisten-01',
      dibuatPada: serverTimestamp(),
    }),
  );
});

test('B06-04: anggota nonaktif tidak dapat mengajukan izin', async () => {
  await siapkanDataPresensiIzin({ statusAnggota: 'NONAKTIF' });

  const db = dbSebagai('praktikan-01');

  await assertFails(
    setDoc(doc(db, 'izin', ID_IZIN), {
      ...dataIzin(),
      dibuatPada: serverTimestamp(),
    }),
  );
});

test('B06-05: pengajuan izin pada sesi yang ditutup ditolak', async () => {
  await siapkanDataPresensiIzin({ statusSesi: 'DITUTUP' });

  const db = dbSebagai('praktikan-01');

  await assertFails(
    setDoc(doc(db, 'izin', ID_IZIN), {
      ...dataIzin(),
      dibuatPada: serverTimestamp(),
    }),
  );
});

test('B06-06: pengajuan izin pada kelas atau sesi arsip ditolak', async () => {
  await siapkanDataPresensiIzin({ diarsipkan: true });

  const db = dbSebagai('praktikan-01');

  await assertFails(
    setDoc(doc(db, 'izin', ID_IZIN), {
      ...dataIzin(),
      dibuatPada: serverTimestamp(),
    }),
  );
});

test('B06-07: pengajuan izin dengan ID yang berbeda dari sesi_UID ditolak', async () => {
  await siapkanDataPresensiIzin();

  const db = dbSebagai('praktikan-01');

  await assertFails(
    setDoc(doc(db, 'izin', 'id-izin-acak'), {
      ...dataIzin(),
      dibuatPada: serverTimestamp(),
    }),
  );
});

test('B06-08: pengajuan izin kedua pada sesi yang sama ditolak', async () => {
  await siapkanDataPresensiIzin({ statusIzin: 'MENUNGGU' });

  const db = dbSebagai('praktikan-01');

  await assertFails(
    setDoc(doc(db, 'izin', ID_IZIN), {
      ...dataIzin(),
      dibuatPada: serverTimestamp(),
    }),
  );
});

test('B06-09: pengajuan izin setelah presensi ditolak', async () => {
  await siapkanDataPresensiIzin({ sudahPresensi: true });

  const db = dbSebagai('praktikan-01');

  await assertFails(
    setDoc(doc(db, 'izin', ID_IZIN), {
      ...dataIzin(),
      dibuatPada: serverTimestamp(),
    }),
  );
});

test('B06-10: status awal izin harus MENUNGGU', async () => {
  await siapkanDataPresensiIzin();

  const db = dbSebagai('praktikan-01');

  await assertFails(
    setDoc(doc(db, 'izin', ID_IZIN), {
      ...dataIzin(),
      statusIzin: 'DISETUJUI',
      dibuatPada: serverTimestamp(),
    }),
  );
});

test('B06-11: field AI dan pemeriksaan harus kosong saat pengajuan', async () => {
  await siapkanDataPresensiIzin();

  const db = dbSebagai('praktikan-01');

  await assertFails(
    setDoc(doc(db, 'izin', ID_IZIN), {
      ...dataIzin(),
      kategoriAi: 'KESEHATAN',
      statusAi: 'SUKSES',
      modelAi: 'model-test',
      waktuAi: serverTimestamp(),
      dibuatPada: serverTimestamp(),
    }),
  );
});