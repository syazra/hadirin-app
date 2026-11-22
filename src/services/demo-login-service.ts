import {
  signInWithEmailAndPassword,
  signOut,
} from '@react-native-firebase/auth';

import { getFirebaseServices, isFirebaseAvailable } from '@/lib/firebase';
import { ambilProfil } from '@/services/auth-service';
import type { AlasanGagal, Hasil, Pengguna, Peran } from '@/types';
import { hasilErrorFirebase } from '@/utils/error-firebase';

const PROJECT_ID =
  process.env.EXPO_PUBLIC_DEMO_LOGIN_PROJECT_ID?.trim() ?? '';

const DEMO_ASISTEN_EMAIL =
  process.env.EXPO_PUBLIC_DEMO_ASISTEN_EMAIL?.trim().toLowerCase() ?? '';
const DEMO_ASISTEN_PASSWORD =
  process.env.EXPO_PUBLIC_DEMO_ASISTEN_PASSWORD ?? '';

const DEMO_PRAKTIKAN_EMAIL =
  process.env.EXPO_PUBLIC_DEMO_PRAKTIKAN_EMAIL?.trim().toLowerCase() ?? '';
const DEMO_PRAKTIKAN_PASSWORD =
  process.env.EXPO_PUBLIC_DEMO_PRAKTIKAN_PASSWORD ?? '';

/** Menentukan apakah konfigurasi demo tersedia di build ini. */
export const demoLoginTersedia =
  isFirebaseAvailable &&
  process.env.EXPO_PUBLIC_DEMO_LOGIN_ENABLED === 'true' &&
  ['demo', 'staging'].includes(
    process.env.EXPO_PUBLIC_DEMO_LOGIN_ENVIRONMENT ?? '',
  ) &&
  Boolean(
    PROJECT_ID &&
    DEMO_ASISTEN_EMAIL &&
    DEMO_ASISTEN_PASSWORD &&
    DEMO_PRAKTIKAN_EMAIL &&
    DEMO_PRAKTIKAN_PASSWORD,
  );

let sedangMasuk = false;

function gagal(
  alasan: AlasanGagal,
  pesan: string,
): Hasil<Pengguna> {
  return { ok: false, alasan, pesan };
}

export async function masukDemo(peran: Peran): Promise<Hasil<Pengguna>> {
  if (!demoLoginTersedia) {
    return gagal(
      'TIDAK_BERWENANG',
      'Demo login tidak tersedia pada build ini.',
    );
  }

  if (peran !== 'ASISTEN' && peran !== 'PRAKTIKAN') {
    return gagal('INPUT_TIDAK_VALID', 'Pilih role demo yang valid.');
  }

  if (sedangMasuk) {
    return gagal('INPUT_TIDAK_VALID', 'Demo login sedang diproses.');
  }

  sedangMasuk = true;

  let authSesi: ReturnType<typeof getFirebaseServices>['auth'] | null = null;
  let uidSesi: string | null = null;

  try {
    const { app, auth } = getFirebaseServices();
    authSesi = auth;

    if (app.options.projectId !== PROJECT_ID) {
      return gagal(
        'TIDAK_BERWENANG',
        'Project Firebase tidak sesuai dengan konfigurasi demo.',
      );
    }

    if (auth.currentUser) {
      return gagal(
        'TIDAK_BERWENANG',
        'Keluar dari akun aktif sebelum masuk demo.',
      );
    }

    const email =
      peran === 'ASISTEN' ? DEMO_ASISTEN_EMAIL : DEMO_PRAKTIKAN_EMAIL;

    const password =
      peran === 'ASISTEN'
        ? DEMO_ASISTEN_PASSWORD
        : DEMO_PRAKTIKAN_PASSWORD;

    const credential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );

    uidSesi = credential.user.uid;

    if (credential.user.email?.toLowerCase() !== email) {
      await signOut(auth);
      uidSesi = null;

      return gagal(
        'AUTENTIKASI_GAGAL',
        'Akun demo tidak sesuai dengan konfigurasi.',
      );
    }

    const profil = await ambilProfil(credential.user.uid);

    if (!profil.ok) {
      await signOut(auth);
      uidSesi = null;
      return profil;
    }

    if (
      profil.data.peran !== peran ||
      profil.data.uid !== credential.user.uid ||
      profil.data.email.toLowerCase() !== email
    ) {
      await signOut(auth);
      uidSesi = null;

      return gagal(
        'PROFIL_BELUM_LENGKAP',
        'Role atau profil akun demo tidak sesuai.',
      );
    }

    return profil;
  } catch (error) {
    if (
      authSesi &&
      uidSesi &&
      authSesi.currentUser?.uid === uidSesi
    ) {
      try {
        await signOut(authSesi);
      } catch {
        // Jangan menutupi error login utama.
      }
    }

    return hasilErrorFirebase(error);
  } finally {
    sedangMasuk = false;
  }
}
