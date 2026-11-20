import * as dotenv from 'dotenv';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

import { DATA_IZIN } from './data/izin';
import { DATA_KEANGGOTAAN } from './data/keanggotaan';
import { DATA_KELAS } from './data/kelas';
import { DATA_LABORATORIUM } from './data/laboratorium';
import { DATA_PENGGUNA } from './data/pengguna';
import { DATA_PRESENSI } from './data/presensi';
import { DATA_SESI } from './data/sesi';

dotenv.config({ path: path.resolve(__dirname, '.env') });

interface SeedStats {
  created: number;
  updated: number;
}

function validateEnvironment() {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const allowedRaw = process.env.ALLOWED_SEED_PROJECTS?.trim();
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST?.trim();
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  const seedPassword = process.env.SEED_USER_PASSWORD?.trim();

  if (!projectId) {
    throw new Error('❌ [ABORT] FIREBASE_PROJECT_ID kosong. Isi file scripts/seed/.env terlebih dahulu.');
  }

  if (!allowedRaw) {
    throw new Error('❌ [ABORT] ALLOWED_SEED_PROJECTS wajib diisi.');
  }

  const allowedProjects = allowedRaw.split(',').map((p) => p.trim()).filter(Boolean);
  if (!allowedProjects.includes(projectId)) {
    throw new Error(
      `❌ [ABORT] Project "${projectId}" tidak terdaftar di ALLOWED_SEED_PROJECTS (${allowedProjects.join(', ')}).`
    );
  }

  if (projectId.toLowerCase().includes('prod')) {
    throw new Error(`❌ [ABORT] Target "${projectId}" terindikasi production! Seeder dibatalkan.`);
  }

  if (!seedPassword || seedPassword.length < 6) {
    throw new Error('❌ [ABORT] SEED_USER_PASSWORD wajib diisi di .env (minimal 6 karakter).');
  }

  if (!emulatorHost) {
    if (!credPath) {
      throw new Error('❌ [ABORT] FIRESTORE_EMULATOR_HOST kosong dan GOOGLE_APPLICATION_CREDENTIALS belum diatur.');
    }
    const resolvedCredPath = path.resolve(__dirname, credPath);
    if (!fs.existsSync(resolvedCredPath)) {
      throw new Error(`❌ [ABORT] File service account tidak ditemukan di: ${resolvedCredPath}`);
    }
    process.env.GOOGLE_APPLICATION_CREDENTIALS = resolvedCredPath;
  }

  return { projectId, isEmulator: Boolean(emulatorHost), seedPassword };
}

function toTimestamp(isoString: string): admin.firestore.Timestamp {
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Format tanggal seeder tidak valid: "${isoString}"`);
  }
  return admin.firestore.Timestamp.fromDate(parsed);
}

async function upsertDoc(
  ref: admin.firestore.DocumentReference,
  data: Record<string, unknown>,
  stats: SeedStats
) {
  const snap = await ref.get();
  await ref.set(data, { merge: true });
  if (snap.exists) {
    stats.updated += 1;
  } else {
    stats.created += 1;
  }
}

async function bersihkanDataSeederLama(
  db: admin.firestore.Firestore,
  auth: admin.auth.Auth
) {
  const koleksiTarget = [
    'laboratorium',
    'kelas',
    'keanggotaan',
    'sesi',
    'presensi',
    'izin',
  ];

  for (const namaKoleksi of koleksiTarget) {
    await db.recursiveDelete(db.collection(namaKoleksi));
  }

  // Hapus semua pengguna & kodePeserta dummy seeder (aman untuk akun Google Sign-In asli)
  const penggunaSnap = await db.collection('pengguna').get();
  for (const docSnap of penggunaSnap.docs) {
    const data = docSnap.data();
    const email = typeof data?.email === 'string' ? data.email : '';
    const isDummySeeder =
      email.endsWith('@hadirin.test') ||
      docSnap.id.startsWith('asisten-') ||
      docSnap.id.startsWith('praktikan-') ||
      docSnap.id.startsWith('seed-');

    if (isDummySeeder) {
      const kode = data?.kodePeserta;
      if (typeof kode === 'string' && kode.length > 0) {
        await db.collection('kodePeserta').doc(kode).delete();
      }
      await db.recursiveDelete(docSnap.ref);

      try {
        await auth.deleteUser(docSnap.id);
      } catch (err: unknown) {
        const kodeError =
          typeof err === 'object' && err !== null && 'code' in err
            ? (err as { code?: unknown }).code
            : undefined;
        if (kodeError !== 'auth/user-not-found') {
          throw err;
        }
      }
    }
  }

  // Bersihkan juga sisa dokumen kodePeserta yang merujuk ke uid dummy
  const kodeSnap = await db.collection('kodePeserta').get();
  for (const docSnap of kodeSnap.docs) {
    const uid = docSnap.data()?.uid;
    if (
      typeof uid === 'string' &&
      (uid.startsWith('asisten-') ||
        uid.startsWith('praktikan-') ||
        uid.startsWith('seed-'))
    ) {
      await docSnap.ref.delete();
    }
  }
}

async function main() {
  console.log('🔍 Memvalidasi environment seeder...');
  const { projectId, isEmulator, seedPassword } = validateEnvironment();

  admin.initializeApp({ projectId });
  const db = admin.firestore();
  const auth = admin.auth();
  const now = admin.firestore.Timestamp.now();

  console.log(`✅ Environment valid! Target: ${projectId} (${isEmulator ? 'EMULATOR' : 'DEV CLOUD'})\n`);

  if (process.argv.includes('--no-clean')) {
    console.log('🧹 Membersihkan data seeder lama...');
    await bersihkanDataSeederLama(db, auth);
    console.log('✅ Data seeder lama berhasil dibersihkan.\n');
  }

  const summary: Record<string, SeedStats> = {
    authUsers: { created: 0, updated: 0 },
    pengguna: { created: 0, updated: 0 },
    kodePeserta: { created: 0, updated: 0 },
    laboratorium: { created: 0, updated: 0 },
    kelas: { created: 0, updated: 0 },
    keanggotaan: { created: 0, updated: 0 },
    sesi: { created: 0, updated: 0 },
    rahasiaQr: { created: 0, updated: 0 },
    presensi: { created: 0, updated: 0 },
    izin: { created: 0, updated: 0 },
  };

  // 1. Seed Firebase Auth + Koleksi pengguna + Proyeksi kodePeserta
  for (const user of DATA_PENGGUNA) {
    try {
      await auth.getUser(user.uid);
      await auth.updateUser(user.uid, {
        email: user.email,
        displayName: user.nama,
        password: seedPassword,
      });
      summary.authUsers.updated += 1;
    } catch (err: unknown) {
      const kodeError =
        typeof err === 'object' && err !== null && 'code' in err
          ? (err as { code?: unknown }).code
          : undefined;
      if (kodeError === 'auth/user-not-found') {
        await auth.createUser({
          uid: user.uid,
          email: user.email,
          displayName: user.nama,
          password: seedPassword,
        });
        summary.authUsers.created += 1;
      } else {
        throw err;
      }
    }

    await upsertDoc(
      db.collection('pengguna').doc(user.uid),
      {
        uid: user.uid,
        nama: user.nama,
        nim: user.nim,
        email: user.email,
        peran: user.peran,
        kodePeserta: user.kodePeserta,
        dibuatPada: now,
      },
      summary.pengguna
    );

    await upsertDoc(
      db.collection('kodePeserta').doc(user.kodePeserta),
      {
        uid: user.uid,
        nama: user.nama,
        nim: user.nim,
        kodePeserta: user.kodePeserta,
        peran: user.peran,
      },
      summary.kodePeserta
    );
  }

  // 2. Seed Laboratorium
  for (const lab of DATA_LABORATORIUM) {
    await upsertDoc(
      db.collection('laboratorium').doc(lab.idLab),
      {
        idLab: lab.idLab,
        kode: lab.kodeLab,
        nama: lab.nama,
        lokasiGedung: lab.lokasiGedung,
        latitude: lab.latitude,
        longitude: lab.longitude,
        radiusPresensi: lab.radiusPresensi,
        aktif: lab.aktif,
      },
      summary.laboratorium
    );
  }

  // 3. Seed Kelas
  for (const kls of DATA_KELAS) {
    await upsertDoc(
      db.collection('kelas').doc(kls.idKelas),
      {
        idKelas: kls.idKelas,
        namaPraktikum: kls.namaPraktikum,
        asistenUid: kls.asistenUid,
        diarsipkan: kls.diarsipkan,
        dibuatPada: now,
      },
      summary.kelas
    );
  }

  // 4. Seed Keanggotaan
  for (const anggota of DATA_KEANGGOTAAN) {
    await upsertDoc(
      db.collection('keanggotaan').doc(anggota.idKeanggotaan),
      {
        idKeanggotaan: anggota.idKeanggotaan,
        kelasId: anggota.kelasId,
        uid: anggota.uid,
        nama: anggota.nama,
        nim: anggota.nim,
        status: anggota.status,
      },
      summary.keanggotaan
    );
  }

  // 5. Seed Sesi + Sub-dokumen rahasia QR
  for (const sesi of DATA_SESI) {
    const sesiRef = db.collection('sesi').doc(sesi.idSesi);

    await upsertDoc(
      sesiRef,
      {
        idSesi: sesi.idSesi,
        kelasId: sesi.kelasId,
        judul: sesi.judul,
        labEnum: sesi.labEnum,
        labId: sesi.idLab,
        lokasi: sesi.lokasi,
        waktuMulai: toTimestamp(sesi.waktuMulai),
        waktuSelesai: toTimestamp(sesi.waktuSelesai),
        statusSesi: sesi.statusSesi,
        diarsipkan: sesi.diarsipkan,
      },
      summary.sesi
    );

    await upsertDoc(
      sesiRef.collection('rahasia').doc('qr'),
      {
        kodeQr: sesi.kodeQr,
        diperbaruiPada: now,
      },
      summary.rahasiaQr
    );
  }

  // 6. Seed Presensi
  for (const pr of DATA_PRESENSI) {
    await upsertDoc(
      db.collection('presensi').doc(pr.idPresensi),
      {
        idPresensi: pr.idPresensi,
        sesiId: pr.sesiId,
        kelasId: pr.kelasId,
        uid: pr.uid,
        waktuHadir: toTimestamp(pr.waktuHadir),
      },
      summary.presensi
    );
  }

  // 7. Seed Izin
  for (const iz of DATA_IZIN) {
    await upsertDoc(
      db.collection('izin').doc(iz.idIzin),
      {
        idIzin: iz.idIzin,
        sesiId: iz.sesiId,
        kelasId: iz.kelasId,
        uid: iz.uid,
        alasan: iz.alasan,
        statusIzin: iz.statusIzin,
        diperiksaOleh: iz.diperiksaOleh,
        waktuPeriksa: iz.waktuPeriksa ? toTimestamp(iz.waktuPeriksa) : null,
        kategoriAi: iz.kategoriAi,
        statusAi: iz.statusAi,
        modelAi: iz.statusAi === 'SUKSES' ? 'gemini-3.6-flash' : null,
        waktuAi: iz.statusAi === 'SUKSES' ? now : null,
        dibuatPada: toTimestamp(iz.dibuatPada),
      },
      summary.izin
    );
  }

  console.log('📊 Ringkasan Seeding:');
  console.table(summary);
  console.log('\n🎉 Seeding selesai tanpa error.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});