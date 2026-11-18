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
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
    writeBatch,
} from 'firebase/firestore';

const PROJECT_ID = 'demo-hadirin-kelas-sesi';
const ID_KELAS = 'kelas-01';
const ID_SESI = 'sesi-01';
const KODE_QR_VALID = '0123456789abcdef0123456789abcdef';

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

    // Profil pengguna uji
    await setDoc(
      doc(db, 'pengguna', 'asisten-01'),
      profil('Asisten Satu', '240601000001', 'ASISTEN', 'ASST0001'),
    );
    await setDoc(
      doc(db, 'pengguna', 'asisten-02'),
      profil('Asisten Dua', '240601000002', 'ASISTEN', 'ASST0002'),
    );
    await setDoc(
      doc(db, 'pengguna', 'praktikan-01'),
      profil('Praktikan Satu', '24060124130088', 'PRAKTIKAN', 'PRKT0001'),
    );
    await setDoc(
      doc(db, 'pengguna', 'praktikan-02'),
      profil('Praktikan Dua', '24060124120024', 'PRAKTIKAN', 'PRKT0002'),
    );

    // Mapping kode peserta
    await setDoc(doc(db, 'kodePeserta', 'PRKT0001'), {
      uid: 'praktikan-01',
      nama: 'Praktikan Satu',
      nim: '24060124130088',
    });

    // Kelas default milik asisten-01
    await setDoc(doc(db, 'kelas', ID_KELAS), {
      namaPraktikum: 'Praktikum PPK 2',
      asistenUid: 'asisten-01',
      diarsipkan: false,
      dibuatPada: new Date(),
    });

    // Keanggotaan default praktikan-01 (AKTIF)
    await setDoc(doc(db, 'keanggotaan', `${ID_KELAS}_praktikan-01`), {
      kelasId: ID_KELAS,
      uid: 'praktikan-01',
      nama: 'Praktikan Satu',
      nim: '24060124130088',
      status: 'AKTIF',
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

async function siapkanSesiDenganQr(
  opsi: {
    statusSesi?: 'BELUM_DIBUKA' | 'DIBUKA' | 'DITUTUP';
    sesiDiarsipkan?: boolean;
    kelasDiarsipkan?: boolean;
  } = {},
) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    if (opsi.kelasDiarsipkan !== undefined) {
      await updateDoc(doc(db, 'kelas', ID_KELAS), {
        diarsipkan: opsi.kelasDiarsipkan,
      });
    }

    await setDoc(doc(db, 'sesi', ID_SESI), {
      kelasId: ID_KELAS,
      judul: 'Pertemuan 1: Firestore',
      lokasi: 'Lab Komputer A',
      waktuMulai: new Date('2026-11-18T08:00:00Z'),
      waktuSelesai: new Date('2026-11-18T10:00:00Z'),
      statusSesi: opsi.statusSesi ?? 'BELUM_DIBUKA',
      diarsipkan: opsi.sesiDiarsipkan ?? false,
    });

    await setDoc(doc(db, 'sesi', ID_SESI, 'rahasia', 'qr'), {
      kodeQr: KODE_QR_VALID,
    });
  });
}

// ==========================================
// B02 — KELAS DAN KEANGGOTAAN PESERTA
// ==========================================

test('B02-01: asisten dapat membuat kelas baru miliknya sendiri', async () => {
  const db = dbSebagai('asisten-01');

  await assertSucceeds(
    setDoc(doc(db, 'kelas', 'kelas-baru'), {
      namaPraktikum: 'Struktur Data',
      asistenUid: 'asisten-01',
      diarsipkan: false,
      dibuatPada: serverTimestamp(),
    }),
  );
});

test('B02-02: praktikan tidak boleh membuat atau mengubah kelas', async () => {
  const db = dbSebagai('praktikan-01');

  await assertFails(
    setDoc(doc(db, 'kelas', 'kelas-ilegal'), {
      namaPraktikum: 'Kelas Ilegal',
      asistenUid: 'praktikan-01',
      diarsipkan: false,
      dibuatPada: serverTimestamp(),
    }),
  );

  await assertFails(
    updateDoc(doc(db, 'kelas', ID_KELAS), {
      namaPraktikum: 'Diubah Praktikan',
    }),
  );
});

test('B02-03: asisten lain tidak dapat membaca atau mengubah kelas bukan miliknya', async () => {
  const db = dbSebagai('asisten-02');

  await assertFails(getDoc(doc(db, 'kelas', ID_KELAS)));
  await assertFails(
    updateDoc(doc(db, 'kelas', ID_KELAS), {
      namaPraktikum: 'Dibajak Asisten Lain',
    }),
  );
});

test('B02-04: asisten pemilik dapat menambah peserta dengan snapshot identitas valid', async () => {
  const db = dbSebagai('asisten-01');

  await assertSucceeds(
    setDoc(doc(db, 'keanggotaan', `${ID_KELAS}_praktikan-02`), {
      kelasId: ID_KELAS,
      uid: 'praktikan-02',
      nama: 'Praktikan Dua',
      nim: '24060124120024',
      status: 'AKTIF',
    }),
  );
});

test('B02-05: tambah peserta ditolak jika snapshot nama/NIM dipalsukan atau target bukan PRAKTIKAN', async () => {
  const db = dbSebagai('asisten-01');

  await assertFails(
    setDoc(doc(db, 'keanggotaan', `${ID_KELAS}_praktikan-02`), {
      kelasId: ID_KELAS,
      uid: 'praktikan-02',
      nama: 'Nama Palsu',
      nim: '24060124120024',
      status: 'AKTIF',
    }),
  );

  await assertFails(
    setDoc(doc(db, 'keanggotaan', `${ID_KELAS}_asisten-02`), {
      kelasId: ID_KELAS,
      uid: 'asisten-02',
      nama: 'Asisten Dua',
      nim: '240601000002',
      status: 'AKTIF',
    }),
  );
});

test('B02-06: asisten dapat menonaktifkan dan mengaktifkan ulang peserta tanpa mengubah snapshot', async () => {
  const db = dbSebagai('asisten-01');
  const anggotaRef = doc(db, 'keanggotaan', `${ID_KELAS}_praktikan-01`);

  await assertSucceeds(updateDoc(anggotaRef, { status: 'NONAKTIF' }));
  await assertSucceeds(updateDoc(anggotaRef, { status: 'AKTIF' }));

  await assertFails(
    updateDoc(anggotaRef, { status: 'NONAKTIF', nama: 'Diubah' }),
  );
});

test('B02-07: hard delete kelas dan keanggotaan ditolak', async () => {
  const db = dbSebagai('asisten-01');

  await assertFails(deleteDoc(doc(db, 'kelas', ID_KELAS)));
  await assertFails(
    deleteDoc(doc(db, 'keanggotaan', `${ID_KELAS}_praktikan-01`)),
  );
});

test('B02-08: arsip kelas satu arah dan memblokir penambahan/perubahan peserta baru', async () => {
  const db = dbSebagai('asisten-01');
  const kelasRef = doc(db, 'kelas', ID_KELAS);

  await assertSucceeds(updateDoc(kelasRef, { diarsipkan: true }));
  await assertFails(updateDoc(kelasRef, { diarsipkan: false }));

  await assertFails(
    setDoc(doc(db, 'keanggotaan', `${ID_KELAS}_praktikan-02`), {
      kelasId: ID_KELAS,
      uid: 'praktikan-02',
      nama: 'Praktikan Dua',
      nim: '24060124120024',
      status: 'AKTIF',
    }),
  );
});

// ==========================================
// B03 — SESI, QR RAHASIA, TRANSISI STATUS, ARSIP
// ==========================================

test('B03-01: asisten pemilik dapat membuat sesi dan rahasia/qr secara atomik dalam satu batch', async () => {
  const db = dbSebagai('asisten-01');
  const batch = writeBatch(db);

  batch.set(doc(db, 'sesi', 'sesi-baru'), {
    kelasId: ID_KELAS,
    judul: 'Pertemuan 2: Auth',
    lokasi: 'Lab B',
    waktuMulai: new Date('2026-11-19T08:00:00Z'),
    waktuSelesai: null,
    statusSesi: 'BELUM_DIBUKA',
    diarsipkan: false,
  });

  batch.set(doc(db, 'sesi', 'sesi-baru', 'rahasia', 'qr'), {
    kodeQr: KODE_QR_VALID,
  });

  await assertSucceeds(batch.commit());
});

test('B03-02: membuat sesi tanpa dokumen rahasia/qr atau format QR tidak valid ditolak', async () => {
  const db = dbSebagai('asisten-01');

  await assertFails(
    setDoc(doc(db, 'sesi', 'sesi-tanpa-qr'), {
      kelasId: ID_KELAS,
      judul: 'Pertemuan Tanpa QR',
      lokasi: 'Lab B',
      waktuMulai: new Date('2026-11-19T08:00:00Z'),
      waktuSelesai: null,
      statusSesi: 'BELUM_DIBUKA',
      diarsipkan: false,
    }),
  );

  const batch = writeBatch(db);
  batch.set(doc(db, 'sesi', 'sesi-qr-lemah'), {
    kelasId: ID_KELAS,
    judul: 'Pertemuan QR Lemah',
    lokasi: 'Lab B',
    waktuMulai: new Date('2026-11-19T08:00:00Z'),
    waktuSelesai: null,
    statusSesi: 'BELUM_DIBUKA',
    diarsipkan: false,
  });
  batch.set(doc(db, 'sesi', 'sesi-qr-lemah', 'rahasia', 'qr'), {
    kodeQr: 'QR-PENDEK-123',
  });

  await assertFails(batch.commit());
});

test('B03-03: hanya asisten pemilik yang dapat get rahasia/qr; praktikan, asisten lain, dan list ditolak', async () => {
  await siapkanSesiDenganQr({ statusSesi: 'DIBUKA' });

  const dbPemilik = dbSebagai('asisten-01');
  const dbAsistenLain = dbSebagai('asisten-02');
  const dbPraktikan = dbSebagai('praktikan-01');

  await assertSucceeds(
    getDoc(doc(dbPemilik, 'sesi', ID_SESI, 'rahasia', 'qr')),
  );

  await assertFails(
    getDocs(collection(dbPemilik, 'sesi', ID_SESI, 'rahasia')),
  );

  await assertFails(
    getDoc(doc(dbAsistenLain, 'sesi', ID_SESI, 'rahasia', 'qr')),
  );
  await assertFails(
    getDoc(doc(dbPraktikan, 'sesi', ID_SESI, 'rahasia', 'qr')),
  );

  await assertFails(
    updateDoc(doc(dbPemilik, 'sesi', ID_SESI, 'rahasia', 'qr'), {
      kodeQr: 'fedcba9876543210fedcba9876543210',
    }),
  );
});

test('B03-04: transisi status sesi hanya BELUM_DIBUKA -> DIBUKA -> DITUTUP', async () => {
  await siapkanSesiDenganQr({ statusSesi: 'BELUM_DIBUKA' });

  const db = dbSebagai('asisten-01');
  const sesiRef = doc(db, 'sesi', ID_SESI);

  await assertFails(updateDoc(sesiRef, { statusSesi: 'DITUTUP' }));
  await assertSucceeds(updateDoc(sesiRef, { statusSesi: 'DIBUKA' }));
  await assertFails(updateDoc(sesiRef, { statusSesi: 'BELUM_DIBUKA' }));
  await assertSucceeds(updateDoc(sesiRef, { statusSesi: 'DITUTUP' }));
  await assertFails(updateDoc(sesiRef, { statusSesi: 'DIBUKA' }));
});

test('B03-05: edit jadwal sesi dipisah dari perubahan status dan menolak waktuSelesai <= waktuMulai', async () => {
  await siapkanSesiDenganQr({ statusSesi: 'BELUM_DIBUKA' });

  const db = dbSebagai('asisten-01');
  const sesiRef = doc(db, 'sesi', ID_SESI);
  const mulai = new Date('2026-11-20T09:00:00Z');
  const selesaiValid = new Date('2026-11-20T11:00:00Z');
  const selesaiTidakValid = new Date('2026-11-20T08:30:00Z');

  await assertSucceeds(
    updateDoc(sesiRef, {
      judul: 'Pertemuan 1 (Revisi)',
      lokasi: 'Lab C',
      waktuMulai: mulai,
      waktuSelesai: selesaiValid,
    }),
  );

  await assertFails(
    updateDoc(sesiRef, {
      waktuMulai: mulai,
      waktuSelesai: selesaiTidakValid,
    }),
  );

  await assertFails(
    updateDoc(sesiRef, {
      judul: 'Ubah Bareng Status',
      statusSesi: 'DIBUKA',
    }),
  );
});

test('B03-06: arsip sesi ditolak saat masih DIBUKA dan berhasil setelah DITUTUP', async () => {
  await siapkanSesiDenganQr({ statusSesi: 'DIBUKA' });

  const db = dbSebagai('asisten-01');
  const sesiRef = doc(db, 'sesi', ID_SESI);

  await assertFails(updateDoc(sesiRef, { diarsipkan: true }));
  await assertSucceeds(updateDoc(sesiRef, { statusSesi: 'DITUTUP' }));
  await assertSucceeds(updateDoc(sesiRef, { diarsipkan: true }));
  await assertFails(deleteDoc(sesiRef));
});

test('B03-07: kelas yang diarsipkan memblokir pembuatan sesi baru dan pembukaan sesi lama', async () => {
  await siapkanSesiDenganQr({
    statusSesi: 'BELUM_DIBUKA',
    kelasDiarsipkan: true,
  });

  const db = dbSebagai('asisten-01');

  await assertFails(
    updateDoc(doc(db, 'sesi', ID_SESI), { statusSesi: 'DIBUKA' }),
  );

  const batch = writeBatch(db);
  batch.set(doc(db, 'sesi', 'sesi-di-kelas-arsip'), {
    kelasId: ID_KELAS,
    judul: 'Sesi Baru',
    lokasi: 'Lab A',
    waktuMulai: new Date('2026-11-21T08:00:00Z'),
    waktuSelesai: null,
    statusSesi: 'BELUM_DIBUKA',
    diarsipkan: false,
  });
  batch.set(doc(db, 'sesi', 'sesi-di-kelas-arsip', 'rahasia', 'qr'), {
    kodeQr: KODE_QR_VALID,
  });

  await assertFails(batch.commit());
});

test('B03-08: akses baca sesi oleh praktikan (anggota aktif vs nonanggota vs riwayat arsip)', async () => {
  await siapkanSesiDenganQr({
    statusSesi: 'DITUTUP',
    sesiDiarsipkan: true,
  });

  const dbAnggota = dbSebagai('praktikan-01');
  const dbNonAnggota = dbSebagai('praktikan-02');

  await assertFails(getDoc(doc(dbNonAnggota, 'sesi', ID_SESI)));
  await assertFails(getDoc(doc(dbAnggota, 'sesi', ID_SESI)));

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const adminDb = context.firestore();
    await updateDoc(doc(adminDb, 'keanggotaan', `${ID_KELAS}_praktikan-01`), {
      status: 'NONAKTIF',
    });
    await setDoc(doc(adminDb, 'presensi', `${ID_SESI}_praktikan-01`), {
      sesiId: ID_SESI,
      kelasId: ID_KELAS,
      uid: 'praktikan-01',
      waktuHadir: new Date(),
      kodeQr: KODE_QR_VALID,
    });
  });

  await assertSucceeds(getDoc(doc(dbAnggota, 'sesi', ID_SESI)));

  await assertFails(
    getDocs(query(collection(dbAnggota, 'sesi'), where('kelasId', '==', ID_KELAS))),
  );
});

// ==========================================
// B08 — REKAP REALTIME & AKSES RIWAYAT NONAKTIF
// ==========================================

test('B08-01: asisten pemilik dapat membaca anggota (AKTIF & NONAKTIF), presensi, dan izin untuk rekap kelas sendiri', async () => {
  await siapkanSesiDenganQr({ statusSesi: 'DITUTUP' });

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const adminDb = context.firestore();

    // Praktikan-01 berstatus NONAKTIF tapi punya presensi
    await updateDoc(doc(adminDb, 'keanggotaan', `${ID_KELAS}_praktikan-01`), {
      status: 'NONAKTIF',
    });
    await setDoc(doc(adminDb, 'presensi', `${ID_SESI}_praktikan-01`), {
      sesiId: ID_SESI,
      kelasId: ID_KELAS,
      uid: 'praktikan-01',
      waktuHadir: new Date('2026-11-18T08:05:00Z'),
      kodeQr: KODE_QR_VALID,
    });

    // Praktikan-02 berstatus AKTIF dan punya izin DISETUJUI
    await setDoc(doc(adminDb, 'keanggotaan', `${ID_KELAS}_praktikan-02`), {
      kelasId: ID_KELAS,
      uid: 'praktikan-02',
      nama: 'Praktikan Dua',
      nim: '24060124120024',
      status: 'AKTIF',
    });
    await setDoc(doc(adminDb, 'izin', `${ID_SESI}_praktikan-02`), {
      sesiId: ID_SESI,
      kelasId: ID_KELAS,
      uid: 'praktikan-02',
      alasan: 'Sakit dengan surat dokter',
      statusIzin: 'DISETUJUI',
      diperiksaOleh: 'asisten-01',
      waktuPeriksa: new Date('2026-11-18T07:50:00Z'),
      kategoriAi: 'KESEHATAN',
      statusAi: 'SUKSES',
      modelAi: 'gemini-2.5-flash',
      waktuAi: new Date('2026-11-18T07:45:00Z'),
      dibuatPada: new Date('2026-11-18T07:40:00Z'),
    });
  });

  const dbAsisten = dbSebagai('asisten-01');

  // Query anggota termasuk NONAKTIF berhasil
  const snapAnggota = await assertSucceeds(
    getDocs(query(collection(dbAsisten, 'keanggotaan'), where('kelasId', '==', ID_KELAS))),
  );
  assert.equal(snapAnggota.size, 2);

  // Query presensi kelas/sesi berhasil
  const snapPresensi = await assertSucceeds(
    getDocs(
      query(
        collection(dbAsisten, 'presensi'),
        where('kelasId', '==', ID_KELAS),
        where('sesiId', '==', ID_SESI),
      ),
    ),
  );
  assert.equal(snapPresensi.size, 1);

  // Query izin kelas/sesi berhasil
  const snapIzin = await assertSucceeds(
    getDocs(
      query(
        collection(dbAsisten, 'izin'),
        where('kelasId', '==', ID_KELAS),
        where('sesiId', '==', ID_SESI),
      ),
    ),
  );
  assert.equal(snapIzin.size, 1);
});

test('B08-02: rekap wajib memakai snapshot keanggotaan; list seluruh koleksi pengguna ditolak', async () => {
  const dbAsisten = dbSebagai('asisten-01');

  await assertFails(getDocs(collection(dbAsisten, 'pengguna')));
  await assertFails(getDoc(doc(dbAsisten, 'pengguna', 'praktikan-01')));
});

test('B08-03: asisten kelas lain tidak dapat membaca rekap anggota, presensi, maupun izin kelas ini', async () => {
  await siapkanSesiDenganQr({ statusSesi: 'DITUTUP' });

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const adminDb = context.firestore();
    await setDoc(doc(adminDb, 'presensi', `${ID_SESI}_praktikan-01`), {
      sesiId: ID_SESI,
      kelasId: ID_KELAS,
      uid: 'praktikan-01',
      waktuHadir: new Date(),
      kodeQr: KODE_QR_VALID,
    });
  });

  const dbAsistenLain = dbSebagai('asisten-02');

  await assertFails(
    getDocs(query(collection(dbAsistenLain, 'keanggotaan'), where('kelasId', '==', ID_KELAS))),
  );
  await assertFails(
    getDocs(query(collection(dbAsistenLain, 'presensi'), where('sesiId', '==', ID_SESI))),
  );
  await assertFails(
    getDocs(query(collection(dbAsistenLain, 'izin'), where('sesiId', '==', ID_SESI))),
  );
});

test('B08-04: peserta NONAKTIF tetap dapat membaca riwayat presensi/izin pribadi dan detail sesi serta kelasnya', async () => {
  await siapkanSesiDenganQr({
    statusSesi: 'DITUTUP',
    sesiDiarsipkan: true,
  });

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const adminDb = context.firestore();
    await updateDoc(doc(adminDb, 'keanggotaan', `${ID_KELAS}_praktikan-01`), {
      status: 'NONAKTIF',
    });
    await setDoc(doc(adminDb, 'presensi', `${ID_SESI}_praktikan-01`), {
      sesiId: ID_SESI,
      kelasId: ID_KELAS,
      uid: 'praktikan-01',
      waktuHadir: new Date(),
      kodeQr: KODE_QR_VALID,
    });
  });

  const dbPraktikan = dbSebagai('praktikan-01');

  // Riwayat presensi pribadi tetap terbaca
  const snapPresensi = await assertSucceeds(
    getDocs(query(collection(dbPraktikan, 'presensi'), where('uid', '==', 'praktikan-01'))),
  );
  assert.equal(snapPresensi.size, 1);

  // Detail sesi & informasi kelas tetap terbaca lewat ID
  await assertSucceeds(getDoc(doc(dbPraktikan, 'sesi', ID_SESI)));
  await assertSucceeds(getDoc(doc(dbPraktikan, 'kelas', ID_KELAS)));

  // Namun list jadwal aktif keanggotaan tidak mengembalikan keanggotaan NONAKTIF
  await assertFails(
    getDocs(query(collection(dbPraktikan, 'keanggotaan'), where('uid', '==', 'praktikan-01'))),
  );
});