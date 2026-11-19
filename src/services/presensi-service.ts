import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from '@react-native-firebase/firestore';
import {
  getFunctions,
  httpsCallable,
} from '@react-native-firebase/functions';

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

function gagal(
  alasan: AlasanGagal,
  pesan: string,
): Hasil<never> {
  return { ok: false, alasan, pesan };
}

function petakanErrorCallable(error: unknown): Hasil<never> {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error
  ) {
    const errObj = error as {
      code?: unknown;
      message?: unknown;
      details?: { alasan?: unknown };
    };

    const kode = String(errObj.code).replace(/^functions\//, '');
    const pesanServer =
      typeof errObj.message === 'string' && errObj.message.trim().length > 0
        ? errObj.message
        : null;
    const alasanDetail =
      typeof errObj.details?.alasan === 'string'
        ? (errObj.details.alasan as AlasanGagal)
        : null;

    if (alasanDetail) {
      return gagal(
        alasanDetail,
        pesanServer ?? 'Presensi ditolak oleh server.',
      );
    }

    switch (kode) {
      case 'invalid-argument':
        return gagal(
          'QR_TIDAK_VALID',
          pesanServer ?? 'Kode QR atau data lokasi tidak valid.',
        );
      case 'already-exists':
        return gagal(
          'SUDAH_PRESENSI',
          pesanServer ?? 'Anda sudah melakukan presensi pada sesi ini.',
        );
      case 'permission-denied':
        return gagal(
          'BUKAN_ANGGOTA',
          pesanServer ?? 'Anda tidak memiliki izin melakukan presensi pada sesi ini.',
        );
      case 'failed-precondition':
        return gagal(
          'INPUT_TIDAK_VALID',
          pesanServer ?? 'Syarat lokasi atau status sesi tidak terpenuhi.',
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

interface RecordAttendanceCallableOutput {
  ok: true;
  idPresensi: string;
  jarakMeter: number;
  radiusPresensi: number;
  waktuHadirIso: string;
}

/**
 * Mencatat presensi praktikan melalui Cloud Function `recordAttendance`
 * dengan validasi QR, geofence radius lab, dan transaksi server-side.
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

  const { auth } = getFirebaseServices();
  const user = auth.currentUser;

  if (!user) {
    return gagal(
      'AUTENTIKASI_GAGAL',
      'Silakan login terlebih dahulu.',
    );
  }

  try {
    const functionsInstance = getFunctions();
    const callable = httpsCallable<
      {
        sesiId: string;
        buktiQr: string;
        koordinat: {
          latitude: number;
          longitude: number;
        };
        akurasi: number;
        timestamp: number;
      },
      RecordAttendanceCallableOutput
    >(functionsInstance, 'recordAttendance');

    const response = await callable({
      sesiId: hasilBaca.idSesi,
      buktiQr: payloadQr,
      koordinat: {
        latitude: posisi.latitude,
        longitude: posisi.longitude,
      },
      akurasi: posisi.accuracy ?? 999,
      timestamp: posisi.timestamp,
    });

    const data = response.data;
    const waktuHadir = data?.waktuHadirIso
      ? new Date(data.waktuHadirIso)
      : new Date();

    return {
      ok: true,
      data: {
        idPresensi: data?.idPresensi ?? `${hasilBaca.idSesi}_${user.uid}`,
        sesiId: hasilBaca.idSesi,
        kelasId: '',
        uid: user.uid,
        waktuHadir: Number.isNaN(waktuHadir.getTime()) ? null : waktuHadir,
      },
    };
  } catch (error) {
    return petakanErrorCallable(error);
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