import { signInWithCustomToken, signOut } from '@react-native-firebase/auth';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';

import { getFirebaseServices, isFirebaseAvailable } from '@/lib/firebase';
import { ambilProfil } from '@/services/auth-service';
import type { AlasanGagal, Hasil, Pengguna, Peran } from '@/types';
import { hasilErrorFirebase } from '@/utils/error-firebase';

/** UI may use this to hide demo actions. Server configuration remains authoritative. */
export const demoLoginTersedia = isFirebaseAvailable
  && process.env.EXPO_PUBLIC_DEMO_LOGIN_ENABLED === 'true'
  && ['demo', 'staging'].includes(process.env.EXPO_PUBLIC_DEMO_LOGIN_ENVIRONMENT ?? '')
  && Boolean(process.env.EXPO_PUBLIC_DEMO_LOGIN_PROJECT_ID?.trim());

let sedangMasuk = false;

function gagal(alasan: AlasanGagal, pesan: string): Hasil<Pengguna> {
  return { ok: false, alasan, pesan };
}

export async function masukDemo(peran: Peran): Promise<Hasil<Pengguna>> {
  if (!demoLoginTersedia) {
    return gagal('TIDAK_BERWENANG', 'Demo login tidak tersedia pada build ini.');
  }
  if (peran !== 'ASISTEN' && peran !== 'PRAKTIKAN') {
    return gagal('INPUT_TIDAK_VALID', 'Pilih peran demo yang valid.');
  }
  if (sedangMasuk) return gagal('INPUT_TIDAK_VALID', 'Demo login sedang diproses.');
  sedangMasuk = true;

  try {
    const { app, appCheck, auth } = getFirebaseServices();
    const currentUid = () => auth.currentUser?.uid;
    if (app.options.projectId !== process.env.EXPO_PUBLIC_DEMO_LOGIN_PROJECT_ID?.trim() || !appCheck) {
      return gagal('TIDAK_BERWENANG', 'Project atau attestation demo belum siap.');
    }
    if (currentUid()) return gagal('TIDAK_BERWENANG', 'Keluar dari akun aktif sebelum masuk demo.');

    const callable = httpsCallable<{ peran: Peran }, { customToken: string }>(
      getFunctions(app, 'asia-southeast2'), 'demoLogin',
      { timeout: 20_000, limitedUseAppCheckTokens: true },
    );
    const { data } = await callable({ peran });
    if (!data || typeof data.customToken !== 'string'
      || !data.customToken.trim() || data.customToken.length > 8192) {
      return gagal('RESPONS_TIDAK_VALID', 'Respons demo login tidak valid.');
    }
    // A manual login may have completed while the callable was pending.
    if (currentUid()) return gagal('TIDAK_BERWENANG', 'Akun aktif sudah berubah.');
    const credential = await signInWithCustomToken(auth, data.customToken);
    let valid = false;
    try {
      const profil = await ambilProfil(credential.user.uid);
      if (!profil.ok || profil.data.peran !== peran || profil.data.uid !== credential.user.uid) {
        return gagal('PROFIL_BELUM_LENGKAP', 'Profil akun demo belum sesuai.');
      }
      if (currentUid() !== credential.user.uid) {
        return gagal('AUTENTIKASI_GAGAL', 'Sesi login sudah berubah.');
      }
      valid = true;
      return profil;
    } finally {
      if (!valid && currentUid() === credential.user.uid) await signOut(auth);
    }
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : null;
    if (code === 'functions/resource-exhausted') {
      return gagal('KUOTA_HABIS', 'Terlalu banyak percobaan demo. Coba lagi nanti.');
    }
    if (code === 'functions/permission-denied' || code === 'functions/unauthenticated'
      || code === 'functions/failed-precondition' || String(code).startsWith('appCheck/')) {
      return gagal('TIDAK_BERWENANG', 'Demo login belum tersedia atau attestation gagal.');
    }
    if (code === 'functions/unavailable') return gagal('JARINGAN', 'Layanan demo belum dapat dihubungi.');
    if (code === 'functions/deadline-exceeded') return gagal('TIMEOUT', 'Demo login melewati batas waktu.');
    return hasilErrorFirebase(error);
  } finally {
    sedangMasuk = false;
  }
}
