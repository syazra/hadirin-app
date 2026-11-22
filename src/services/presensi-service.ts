import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
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

function petakanErrorFirestore(error: unknown): Hasil<never> {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error
  ) {
    const errObj = error as {
      code?: unknown;
      message?: unknown;
    };

    const kode = String(errObj.code).replace(/^firestore\//, '');
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

function hitungJarakMeter(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
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
 * Mencatat presensi praktikan melalui transaksi Firestore klien
 * dengan validasi QR, geofence radius lab, dan aturan Firestore Rules (Spark Plan).
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

  const { auth, db } = getFirebaseServices();
  const user = auth.currentUser;

  if (!user) {
    return gagal(
      'AUTENTIKASI_GAGAL',
      'Silakan login terlebih dahulu.',
    );
  }

  const sesiId = hasilBaca.idSesi;
  const idPresensi = `${sesiId}_${user.uid}`;

  try {
    const hasilTx = await runTransaction(db, async (tx) => {
      const sesiRef = doc(db, 'sesi', sesiId);
      const sesiSnap = await tx.get(sesiRef);

      if (!sesiSnap.exists()) {
        throw new Error('DATA_TIDAK_DITEMUKAN|Sesi praktikum tidak ditemukan.');
      }

      const sesiData = sesiSnap.data()!;
      const kelasId = String(sesiData.kelasId ?? '');
      const labId = typeof sesiData.labId === 'string' ? sesiData.labId.trim() : '';
      const lokasiNama = typeof sesiData.lokasi === 'string' ? sesiData.lokasi.trim() : '';

      if (sesiData.diarsipkan) {
        throw new Error('DATA_DIARSIPKAN|Sesi praktikum ini sudah diarsipkan.');
      }

      if (sesiData.statusSesi === 'BELUM_DIBUKA') {
        throw new Error('BELUM_DIBUKA|Sesi presensi belum dibuka oleh asisten.');
      }

      if (sesiData.statusSesi !== 'DIBUKA') {
        throw new Error('SUDAH_DITUTUP|Sesi presensi sudah ditutup.');
      }

      // Validasi kode QR rahasia
      const qrSnap = await tx.get(doc(db, 'sesi', sesiId, 'rahasia', 'qr'));
      const kodeQrServer = qrSnap.exists() ? String(qrSnap.data()?.kodeQr ?? '') : '';
      if (!kodeQrServer || kodeQrServer.trim() !== hasilBaca.kodeQr.trim()) {
        throw new Error('QR_TIDAK_VALID|Kode QR tidak valid atau sudah kedaluwarsa.');
      }

      // Validasi geofence laboratorium (mendukung labId maupun fallback nama lokasi)
      let labData: Record<string, unknown> | null = null;

      if (labId) {
        const labSnap = await tx.get(doc(db, 'laboratorium', labId));
        if (labSnap.exists()) {
          labData = labSnap.data() ?? null;
        }
      }

      if (!labData && lokasiNama) {
        const labQuerySnap = await getDocs(
          query(
            collection(db, 'laboratorium'),
            where('nama', '==', lokasiNama),
            limit(1),
          ),
        );
        if (!labQuerySnap.empty) {
          labData = labQuerySnap.docs[0].data() ?? null;
        }
      }

      if (!labData) {
        throw new Error(
          'DATA_TIDAK_DITEMUKAN|Data laboratorium untuk sesi ini tidak ditemukan.',
        );
      }

      if (labData.aktif === false) {
        throw new Error(
          'DATA_TIDAK_DITEMUKAN|Lokasi laboratorium untuk sesi ini sedang nonaktif.',
        );
      }

      const radiusPresensi = Number(labData.radiusPresensi ?? 50);
      const jarakMeter = hitungJarakMeter(
        posisi.latitude,
        posisi.longitude,
        Number(labData.latitude),
        Number(labData.longitude),
      );

      if (jarakMeter > radiusPresensi) {
        throw new Error(
          `INPUT_TIDAK_VALID|Anda berada di luar area laboratorium (${Math.round(jarakMeter)} m dari titik pusat, batas ${radiusPresensi} m).`,
        );
      }

      // Validasi keanggotaan aktif
      const anggotaSnap = await tx.get(
        doc(db, 'keanggotaan', `${kelasId}_${user.uid}`),
      );
      if (!anggotaSnap.exists() || anggotaSnap.data()?.status !== 'AKTIF') {
        throw new Error('BUKAN_ANGGOTA|Anda bukan anggota aktif pada kelas praktikum ini.');
      }

      // Validasi belum pernah presensi
      const presensiRef = doc(db, 'presensi', idPresensi);
      const presensiSnap = await tx.get(presensiRef);
      if (presensiSnap.exists()) {
        throw new Error('SUDAH_PRESENSI|Anda sudah tercatat hadir pada sesi ini.');
      }

      // Validasi tidak ada pengajuan izin
      const izinSnap = await tx.get(doc(db, 'izin', `${sesiId}_${user.uid}`));
      if (izinSnap.exists()) {
        const statusIzin = izinSnap.data()?.statusIzin;
        if (statusIzin === 'MENUNGGU' || statusIzin === 'DISETUJUI') {
          throw new Error(
            'ADA_IZIN|Presensi tidak dapat dilakukan karena pengajuan izin masih menunggu atau sudah disetujui.',
          );
        }
      }

      const jarakDibulatkan = Math.round(jarakMeter * 10) / 10;

      tx.set(presensiRef, {
        idPresensi,
        sesiId,
        kelasId,
        uid: user.uid,
        waktuHadir: serverTimestamp(),
        jarakMeter: jarakDibulatkan,
      });

      return { kelasId };
    });

    return {
      ok: true,
      data: {
        idPresensi,
        sesiId,
        kelasId: hasilTx.kelasId,
        uid: user.uid,
        waktuHadir: new Date(),
      },
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('|')) {
      const [kode, pesan] = error.message.split('|');
      return gagal(kode as AlasanGagal, pesan);
    }
    return petakanErrorFirestore(error);
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