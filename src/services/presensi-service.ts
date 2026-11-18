import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from '@react-native-firebase/firestore';

import {
  getFirebaseServices,
  isFirebaseAvailable,
} from '@/lib/firebase';

import { bacaPayloadQr } from '@/utils/qr-payload';

import type {
  AlasanGagal,
  Hasil,
  Presensi,
} from '@/types';

function gagal(
  alasan: AlasanGagal,
  pesan: string,
): Hasil<never> {
  return { ok: false, alasan, pesan };
}

function petakanError(
  error: unknown,
  sedangMenulisPresensi = false,
): Hasil<never> {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error
  ) {
    const kode = String(
      (error as { code: unknown }).code,
    ).replace(/^firestore\//, '');

    switch (kode) {
      case 'permission-denied':
        if (sedangMenulisPresensi) {
          return gagal(
            'QR_TIDAK_VALID',
            'Kode QR tidak valid atau ditolak oleh server.',
          );
        }
        return gagal(
          'TIDAK_BERWENANG',
          'Anda tidak memiliki izin melakukan presensi.',
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

      case 'not-found':
        return gagal(
          'DATA_TIDAK_DITEMUKAN',
          'Data sesi tidak ditemukan.',
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
 * Mencatat presensi praktikan melalui QR.
 *
 * ID dokumen presensi: sesiId_uid.
 * Praktikan tidak membaca dokumen rahasia sesi/{id}/rahasia/qr;
 * validasi kecocokan kodeQr dilakukan oleh Firestore Security Rules.
 */
export async function catatPresensiDariQr(
  payloadQr: string,
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

  const { idSesi, kodeQr } = hasilBaca;
  let sedangMenulisPresensi = false;

  try {
    const { auth, db } = getFirebaseServices();
    const user = auth.currentUser;

    if (!user) {
      return gagal(
        'AUTENTIKASI_GAGAL',
        'Silakan login terlebih dahulu.',
      );
    }

    const uid = user.uid;

    const sesiRef = doc(db, 'sesi', idSesi);
    const profilRef = doc(db, 'pengguna', uid);

    const hasilTransaksi = await runTransaction(
      db,
      async (tx) => {
        sedangMenulisPresensi = false;

        // Baca sesi dan profil terlebih dahulu.
        const [sesiSnap, profilSnap] = await Promise.all([
          tx.get(sesiRef),
          tx.get(profilRef),
        ]);

        if (!sesiSnap.exists()) {
          return gagal(
            'DATA_TIDAK_DITEMUKAN',
            'Sesi praktikum tidak ditemukan.',
          );
        }

        const profilData = profilSnap.data();

        if (
          !profilSnap.exists() ||
          profilData?.peran !== 'PRAKTIKAN'
        ) {
          return gagal(
            'TIDAK_BERWENANG',
            'Akun ini bukan akun praktikan.',
          );
        }

        const sesiData = sesiSnap.data();
        const kelasId = sesiData?.kelasId;

        if (
          typeof kelasId !== 'string' ||
          kelasId.length === 0
        ) {
          return gagal(
            'DATA_TIDAK_DITEMUKAN',
            'Data kelas pada sesi tidak valid.',
          );
        }

        const kelasRef = doc(db, 'kelas', kelasId);
        const anggotaRef = doc(
          db,
          'keanggotaan',
          `${kelasId}_${uid}`,
        );
        const presensiRef = doc(
          db,
          'presensi',
          `${idSesi}_${uid}`,
        );
        const izinRef = doc(
          db,
          'izin',
          `${idSesi}_${uid}`,
        );

        // Baca semua dokumen yang berhak diakses sebelum melakukan penulisan.
        // Dokumen rahasia/qr TIDAK dibaca dari klien; validasi dilakukan Rules.
        const [
          kelasSnap,
          anggotaSnap,
          presensiSnap,
          izinSnap,
        ] = await Promise.all([
          tx.get(kelasRef),
          tx.get(anggotaRef),
          tx.get(presensiRef),
          tx.get(izinRef),
        ]);

        const kelasData = kelasSnap.data();
        const anggotaData = anggotaSnap.data();
        const izinData = izinSnap.data();

        if (!kelasSnap.exists() || !kelasData) {
          return gagal(
            'DATA_TIDAK_DITEMUKAN',
            'Kelas tidak ditemukan.',
          );
        }

        if (
          sesiData?.diarsipkan === true ||
          kelasData.diarsipkan === true
        ) {
          return gagal(
            'DATA_DIARSIPKAN',
            'Sesi atau kelas sudah diarsipkan.',
          );
        }

        if (sesiData?.statusSesi === 'BELUM_DIBUKA') {
          return gagal(
            'BELUM_DIBUKA',
            'Sesi praktikum belum dibuka.',
          );
        }

        if (sesiData?.statusSesi === 'DITUTUP') {
          return gagal(
            'SUDAH_DITUTUP',
            'Sesi praktikum sudah ditutup.',
          );
        }

        if (sesiData?.statusSesi !== 'DIBUKA') {
          return gagal(
            'INPUT_TIDAK_VALID',
            'Status sesi tidak valid.',
          );
        }

        if (
          !anggotaSnap.exists() ||
          anggotaData?.status !== 'AKTIF'
        ) {
          return gagal(
            'BUKAN_ANGGOTA',
            'Anda bukan anggota aktif kelas ini.',
          );
        }

        if (presensiSnap.exists()) {
          return gagal(
            'SUDAH_PRESENSI',
            'Anda sudah melakukan presensi pada sesi ini.',
          );
        }

        const statusIzin = izinData?.statusIzin;

        if (
          statusIzin === 'MENUNGGU' ||
          statusIzin === 'DISETUJUI'
        ) {
          return gagal(
            'SUDAH_ADA_IZIN',
            'Presensi tidak dapat dilakukan karena pengajuan izin masih menunggu atau sudah disetujui.',
          );
        }

        // Izin DITOLAK tidak menghalangi praktikan melakukan presensi.
        // kodeQr dikirim untuk divalidasi Rules terhadap sesi/{idSesi}/rahasia/qr.
        sedangMenulisPresensi = true;
        tx.set(presensiRef, {
          sesiId: idSesi,
          kelasId,
          uid,
          waktuHadir: serverTimestamp(),
          kodeQr,
        });

        return {
          ok: true,
          data: {
            idPresensi: `${idSesi}_${uid}`,
            sesiId: idSesi,
            kelasId,
            uid,
            waktuHadir: null,
          },
        } satisfies Hasil<Presensi>;
      },
    );

    return hasilTransaksi;
  } catch (error) {
    return petakanError(error, sedangMenulisPresensi);
  }
}

/**
 * Mendengarkan daftar presensi berdasarkan sesi.
 * Menyelesaikan kelasId dari dokumen sesi terlebih dahulu agar query
 * sesuai dengan Firestore Security Rules.
 */
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

/**
 * Mendengarkan riwayat presensi berdasarkan pengguna.
 */
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