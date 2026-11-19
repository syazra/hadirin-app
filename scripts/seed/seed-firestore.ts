import * as dotenv from 'dotenv';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Muat .env khusus di folder scripts/seed
dotenv.config({ path: path.resolve(__dirname, '.env') });

function validateEnvironment() {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const allowedRaw = process.env.ALLOWED_SEED_PROJECTS?.trim();
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST?.trim();
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();

  if (!projectId) {
    throw new Error('❌ [ABORT] FIREBASE_PROJECT_ID kosong. Salin .env.example menjadi .env dan isi konfigurasi.');
  }

  if (!allowedRaw) {
    throw new Error('❌ [ABORT] ALLOWED_SEED_PROJECTS wajib diisi untuk mencegah write ke project yang salah.');
  }

  const allowedProjects = allowedRaw.split(',').map((p) => p.trim()).filter(Boolean);
  if (!allowedProjects.includes(projectId)) {
    throw new Error(
      `❌ [ABORT] Project "${projectId}" tidak ada dalam daftar ALLOWED_SEED_PROJECTS (${allowedProjects.join(', ')}).`
    );
  }

  // Blokir kata kunci production secara eksplisit
  if (projectId.toLowerCase().includes('prod')) {
    throw new Error(`❌ [ABORT] Target "${projectId}" terindikasi production! Seeder dibatalkan.`);
  }

  // Jika tidak memakai emulator, service account JSON wajib ada
  if (!emulatorHost) {
    if (!credPath) {
      throw new Error(
        '❌ [ABORT] FIRESTORE_EMULATOR_HOST kosong dan GOOGLE_APPLICATION_CREDENTIALS belum diatur.'
      );
    }
    const resolvedCredPath = path.resolve(__dirname, credPath);
    if (!fs.existsSync(resolvedCredPath)) {
      throw new Error(`❌ [ABORT] File service account tidak ditemukan di: ${resolvedCredPath}`);
    }
    process.env.GOOGLE_APPLICATION_CREDENTIALS = resolvedCredPath;
  }

  return { projectId, isEmulator: Boolean(emulatorHost) };
}

async function main() {
  console.log('🔍 Memvalidasi environment seeder...');
  const { projectId, isEmulator } = validateEnvironment();

  admin.initializeApp({ projectId });
  const db = admin.firestore();

  console.log(`✅ Environment valid! Target: ${projectId} (${isEmulator ? 'EMULATOR' : 'DEV CLOUD'})`);
  console.log('🚀 Siap menjalankan proses seeding (data dummy akan dipasang pada AZ-S2-02)...');

  // Placeholder untuk AZ-S2-02:
  // await seedPengguna(db);
  // await seedLaboratorium(db);
  // await seedKelas(db);
  // await seedKeanggotaan(db);
  // await seedSesi(db);
  // await seedPresensi(db);
  // await seedIzin(db);

  console.log('🎉 Proses selesai.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});