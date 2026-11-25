import { getIdToken } from '@react-native-firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from '@react-native-firebase/firestore';

import {
  getFirebaseServices,
  isFirebaseAvailable,
} from '@/lib/firebase';
import type {
  AlasanGagal,
  Hasil,
  Presensi,
} from '@/types';
import type { KoordinatPengguna } from '@/types/location';
import { bacaPayloadQr } from '@/utils/qr-payload';

const BATAS_AKURASI_MAKSIMAL_METER = 50;
const BATAS_USIA_LOKASI_MS = 30_000;
const TIMEOUT_PRESENSI_MS = 15_000;

const ALASAN_GAGAL_VALID: readonly AlasanGagal[] = [
  'BELUM_DIBUKA',
  'SUDAH_DITUTUP',
  'SUDAH_PRESENSI',
  'QR_TIDAK_VALID',
  'BUKAN_ANGGOTA',
  'ADA_IZIN',
  'SUDAH_HADIR',
  'SUDAH_ADA_IZIN',
  'SUDAH_DIPUTUSKAN',
  'DATA_TIDAK_DITEMUKAN',
  'TIDAK_BERWENANG',
  'INPUT_TIDAK_VALID',
  'PESERTA_SUDAH_AKTIF',
  'DATA_DIARSIPKAN',
  'PROFIL_BELUM_LENGKAP',
  'AUTENTIKASI_GAGAL',
  'JARINGAN',
  'TIMEOUT',
  'KUOTA_HABIS',
  'RESPONS_TIDAK_VALID',
  'TIDAK_DIKENAL',
];

function adalahObjek(nilai: unknown): nilai is Record<string, unknown> {
  return typeof nilai === 'object' && nilai !== null && !Array.isArray(nilai);
}

function gagal(
  alasan: AlasanGagal,
  pesan: string,
): Hasil<never> {
  return { ok: false, alasan, pesan };
}

function petakanErrorFirebase(error: unknown): Hasil<never> {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error
  ) {
    const errObj = error as {
      code?: unknown;
      message?: unknown;
    };

    const kode = String(errObj.code).replace(/^(firestore|auth)\//, '');
    const pesanServer =
      typeof errObj.message === 'string' && errObj.message.trim().length > 0
        ? errObj.message
        : null;

    switch (kode) {
      case 'permission-denied':
        return gagal(
          'BUKAN_ANGGOTA',
          'Presensi ditolak. Pastikan sesi sedang dibuka, Anda anggota aktif, dan belum mengajukan izin.',
        );
      case 'not-found':
        return gagal(
          'DATA_TIDAK_DITEMUKAN',
          pesanServer ?? 'Data sesi atau laboratorium tidak ditemukan.',
        );
      case 'unauthenticated':
        return gagal(
          'AUTENTIKASI_GAGAL',
          'Silakan login kembali.',
        );
      case 'unavailable':
      case 'network-request-failed':
        return gagal(
          'JARINGAN',
          'Koneksi terganggu. Periksa jaringan lalu coba lagi.',
        );
      case 'deadline-exceeded':
        return gagal(
          'TIMEOUT',
          'Permintaan presensi melewati batas waktu.',
        );
    }
  }

  return gagal(
    'TIDAK_DIKENAL',
    error instanceof Error
      ? error.message
      : 'Terjadi kesalahan saat mencatat presensi.',
  );
}

function konversiTanggal(nilai: unknown): Date | null {
  if (nilai instanceof Date) {
    return Number.isNaN(nilai.getTime()) ? null : nilai;
  }

  if (
    typeof nilai === 'object' &&
    nilai !== null &&
    'toDate' in nilai &&
    typeof nilai.toDate === 'function'
  ) {
    const tanggal = (nilai.toDate as () => Date)();

    return tanggal instanceof Date &&
      !Number.isNaN(tanggal.getTime())
      ? tanggal
      : null;
  }

  return null;
}

type SnapshotMinimal = {
  id: string;
  data: () => Record<string, unknown> | undefined;
};

function petakanPresensi(
  snapshot: SnapshotMinimal,
): Presensi | null {
  const data = snapshot.data();

  if (!data) {
    return null;
  }

  return {
    idPresensi: snapshot.id,
    sesiId: typeof data.sesiId === 'string' ? data.sesiId : '',
    kelasId: typeof data.kelasId === 'string' ? data.kelasId : '',
    uid: typeof data.uid === 'string' ? data.uid : '',
    waktuHadir: konversiTanggal(data.waktuHadir),
  };
}

/**
 * Mencatat presensi praktikan melalui backend HTTPS tepercaya
 * yang memverifikasi ID token, sesi, QR, keanggotaan, izin, dan geofence laboratorium.
 */
export async function catatPresensiDariQr(
  payloadQr: string,
  posisi: KoordinatPengguna | null,
): Promise<Hasil<Presensi>> {
  if (!isFirebaseAvailable) {
    return gagal(
      'TIDAK_DIKENAL',
      'Firebase Hadir.in saat ini hanya tersedia di Android.',
    );
  }

  const hasilBaca = bacaPayloadQr(payloadQr);

  if (!hasilBaca) {
    return gagal(
      'QR_TIDAK_VALID',
      'Format QR tidak valid.',
    );
  }

  if (!posisi) {
    return gagal(
      'INPUT_TIDAK_VALID',
      'Lokasi GPS belum tersedia. Aktifkan GPS dan coba lagi.',
    );
  }

  if (
    !Number.isFinite(posisi.latitude) ||
    !Number.isFinite(posisi.longitude)
  ) {
    return gagal(
      'INPUT_TIDAK_VALID',
      'Koordinat lokasi GPS tidak valid. Perbarui lokasi lalu coba lagi.',
    );
  }

  if (
    posisi.accuracy === null ||
    !Number.isFinite(posisi.accuracy) ||
    posisi.accuracy <= 0 ||
    posisi.accuracy > BATAS_AKURASI_MAKSIMAL_METER
  ) {
    return gagal(
      'INPUT_TIDAK_VALID',
      'Akurasi GPS terlalu rendah (maksimal 50 m). Pastikan berada di area terbuka lalu perbarui lokasi.',
    );
  }

  if (
    !Number.isFinite(posisi.timestamp) ||
    Date.now() - posisi.timestamp > BATAS_USIA_LOKASI_MS
  ) {
    return gagal(
      'INPUT_TIDAK_VALID',
      'Lokasi GPS sudah kedaluwarsa. Perbarui lokasi GPS terlebih dahulu.',
    );
  }

  const attendanceUrl = process.env.EXPO_PUBLIC_ATTENDANCE_API_URL?.trim();
  const proxyUrl = process.env.EXPO_PUBLIC_GEMINI_PROXY_URL?.trim();
  const baseUrl = (attendanceUrl || proxyUrl || '').replace(/\/$/, '');

  if (!baseUrl) {
    return gagal(
      'TIDAK_DIKENAL',
      'Alamat layanan presensi belum dikonfigurasi.',
    );
  }

  const { auth } = getFirebaseServices();
  const user = auth.currentUser;

  if (!user) {
    return gagal(
      'AUTENTIKASI_GAGAL',
      'Silakan login terlebih dahulu.',
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_PRESENSI_MS);

  try {
    const token = await getIdToken(user);
    const response = await fetch(`${baseUrl}/api/presensi`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sesiId: hasilBaca.idSesi,
        buktiQr: payloadQr.trim(),
        koordinat: {
          latitude: posisi.latitude,
          longitude: posisi.longitude,
        },
        akurasi: posisi.accuracy,
        timestamp: posisi.timestamp,
      }),
      signal: controller.signal,
    });

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return gagal(
        'RESPONS_TIDAK_VALID',
        'Respons layanan presensi tidak dapat dibaca.',
      );
    }

    if (
      response.ok &&
      adalahObjek(body) &&
      body.ok === true &&
      adalahObjek(body.data)
    ) {
      const data = body.data;
      const waktuParsed =
        typeof data.waktuHadirIso === 'string'
          ? new Date(data.waktuHadirIso)
          : null;
      const waktuHadir =
        waktuParsed && !Number.isNaN(waktuParsed.getTime())
          ? waktuParsed
          : new Date();

      return {
        ok: true,
        data: {
          idPresensi:
            typeof data.idPresensi === 'string' && data.idPresensi.trim()
              ? data.idPresensi
              : `${hasilBaca.idSesi}_${user.uid}`,
          sesiId:
            typeof data.sesiId === 'string' && data.sesiId.trim()
              ? data.sesiId
              : hasilBaca.idSesi,
          kelasId: typeof data.kelasId === 'string' ? data.kelasId : '',
          uid:
            typeof data.uid === 'string' && data.uid.trim()
              ? data.uid
              : user.uid,
          waktuHadir,
        },
      };
    }

    if (
      adalahObjek(body) &&
      typeof body.alasan === 'string' &&
      ALASAN_GAGAL_VALID.includes(body.alasan as AlasanGagal)
    ) {
      return gagal(
        body.alasan as AlasanGagal,
        typeof body.pesan === 'string' && body.pesan.trim().length > 0
          ? body.pesan
          : 'Gagal mencatat presensi.',
      );
    }

    return gagal(
      'TIDAK_DIKENAL',
      'Layanan presensi gagal memproses permintaan.',
    );
  } catch (error) {
    const namaError =
      error instanceof Error
        ? error.name
        : adalahObjek(error) && typeof error.name === 'string'
          ? error.name
          : '';

    if (namaError === 'AbortError') {
      return gagal(
        'TIMEOUT',
        'Permintaan presensi melewati batas waktu. Periksa koneksi lalu coba lagi.',
      );
    }

    if (error instanceof TypeError || namaError === 'TypeError') {
      return gagal(
        'JARINGAN',
        'Layanan presensi tidak dapat dijangkau. Periksa koneksi internet lalu coba lagi.',
      );
    }

    return petakanErrorFirebase(error);
  } finally {
    clearTimeout(timeoutId);
  }
}

export function listenPresensiSesi(
  sesiId: string,
  callback: (presensi: Presensi[]) => void,
  onError: (error: Error) => void,
): () => void {
  const idBersih = sesiId.trim();
  if (!idBersih) {
    callback([]);
    return () => {};
  }

  if (!isFirebaseAvailable) {
    onError(
      new Error(
        'Firebase Hadir.in saat ini hanya tersedia di Android.',
      ),
    );
    return () => {};
  }

  const { db } = getFirebaseServices();
  let aktif = true;
  let unsubscribeSnapshot: (() => void) | null = null;

  getDoc(doc(db, 'sesi', idBersih))
    .then((sesiSnap) => {
      if (!aktif) return;

      if (!sesiSnap.exists()) {
        callback([]);
        return;
      }

      const kelasId = sesiSnap.data()?.kelasId;
      if (typeof kelasId !== 'string' || kelasId.length === 0) {
        callback([]);
        return;
      }

      const q = query(
        collection(db, 'presensi'),
        where('kelasId', '==', kelasId),
        where('sesiId', '==', idBersih),
      );

      unsubscribeSnapshot = onSnapshot(
        q,
        (snapshot) => {
          const daftar: Presensi[] = [];

          for (const item of snapshot.docs) {
            const presensi = petakanPresensi(item);

            if (presensi) {
              daftar.push(presensi);
            }
          }

          callback(daftar);
        },
        onError,
      );
    })
    .catch((err) => {
      if (!aktif) return;
      onError(
        err instanceof Error
          ? err
          : new Error('Gagal memuat informasi sesi presensi.'),
      );
    });

  return () => {
    aktif = false;
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
    }
  };
}

export function listenPresensiPengguna(
  uid: string,
  callback: (presensi: Presensi[]) => void,
  onError: (error: Error) => void,
): () => void {
  const uidBersih = uid.trim();
  if (!uidBersih) {
    callback([]);
    return () => {};
  }

  if (!isFirebaseAvailable) {
    onError(
      new Error(
        'Firebase Hadir.in saat ini hanya tersedia di Android.',
      ),
    );
    return () => {};
  }

  const { db } = getFirebaseServices();

  const q = query(
    collection(db, 'presensi'),
    where('uid', '==', uidBersih),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const daftar: Presensi[] = [];

      for (const item of snapshot.docs) {
        const presensi = petakanPresensi(item);

        if (presensi) {
          daftar.push(presensi);
        }
      }

      callback(daftar);
    },
    onError,
  );
}