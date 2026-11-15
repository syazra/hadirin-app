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

import { getFirebaseServices } from '@/lib/firebase';
import type { AlasanGagal, Hasil, Izin, StatusIzin } from '@/types';

function gagal(alasan: AlasanGagal, pesan: string): Hasil<Izin> {
  return { ok: false, alasan, pesan };
}

function tanggal(nilai: unknown): Date | null {
  if (!nilai) return null;
  if (nilai instanceof Date) return nilai;

  if (
    typeof nilai === 'object' &&
    nilai !== null &&
    'toDate' in nilai &&
    typeof nilai.toDate === 'function'
  ) {
    return nilai.toDate();
  }

  return null;
}

function petakanIzin(
  id: string,
  data: Record<string, unknown>,
): Izin {
  return {
    idIzin: id,
    sesiId: String(data.sesiId),
    kelasId: String(data.kelasId),
    uid: String(data.uid),
    alasan: String(data.alasan),
    statusIzin: data.statusIzin as StatusIzin,
    diperiksaOleh: (data.diperiksaOleh as string | null) ?? null,
    waktuPeriksa: tanggal(data.waktuPeriksa),
    kategoriAi: (data.kategoriAi as Izin['kategoriAi']) ?? null,
    statusAi: data.statusAi as Izin['statusAi'],
    modelAi: (data.modelAi as string | null) ?? null,
    waktuAi: tanggal(data.waktuAi),
    dibuatPada: tanggal(data.dibuatPada),
  };
}

function pesanError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Terjadi kesalahan saat mengakses data izin.';
}

export async function ajukanIzin(
  sesiId: string,
  alasan: string,
): Promise<Hasil<Izin>> {
  const alasanBersih = alasan.trim();

  if (!sesiId || !alasanBersih || alasanBersih.length > 2000) {
    return gagal('INPUT_TIDAK_VALID', 'Alasan izin wajib diisi dan maksimal 2.000 karakter.');
  }

  try {
    const { auth, db } = getFirebaseServices();
    const penggunaAktif = auth.currentUser;

    if (!penggunaAktif) {
      return gagal('AUTENTIKASI_GAGAL', 'Silakan login terlebih dahulu.');
    }

    const uid = penggunaAktif.uid;
    const idIzin = `${sesiId}_${uid}`;

    const penggunaRef = doc(db, 'pengguna', uid);
    const sesiRef = doc(db, 'sesi', sesiId);
    const izinRef = doc(db, 'izin', idIzin);
    const presensiRef = doc(db, 'presensi', idIzin);

    const profilSnap = await getDoc(penggunaRef);
    if (!profilSnap.exists() || profilSnap.data()?.peran !== 'PRAKTIKAN') {
      return gagal('TIDAK_BERWENANG', 'Hanya praktikan yang dapat mengajukan izin.');
    }

    await runTransaction(db, async (transaction) => {
      const sesiSnap = await transaction.get(sesiRef);
      const izinSnap = await transaction.get(izinRef);
      const presensiSnap = await transaction.get(presensiRef);

      if (!sesiSnap.exists()) {
        throw new Error('DATA_TIDAK_DITEMUKAN');
      }

      const sesi = sesiSnap.data();
      const kelasId = String(sesi.kelasId);

      const kelasRef = doc(db, 'kelas', kelasId);
      const anggotaRef = doc(db, 'keanggotaan', `${kelasId}_${uid}`);

      const kelasSnap = await transaction.get(kelasRef);
      const anggotaSnap = await transaction.get(anggotaRef);

      if (!kelasSnap.exists() || !anggotaSnap.exists()) {
        throw new Error('BUKAN_ANGGOTA');
      }

      const kelas = kelasSnap.data();
      const anggota = anggotaSnap.data();

      if (kelas.diarsipkan === true || sesi.diarsipkan === true) {
        throw new Error('DATA_DIARSIPKAN');
      }

      if (sesi.statusSesi === 'DITUTUP') {
        throw new Error('SUDAH_DITUTUP');
      }

      if (
        anggota.uid !== uid ||
        anggota.kelasId !== kelasId ||
        anggota.status !== 'AKTIF'
      ) {
        throw new Error('BUKAN_ANGGOTA');
      }

      if (izinSnap.exists()) {
        throw new Error('SUDAH_ADA_IZIN');
      }

      if (presensiSnap.exists()) {
        throw new Error('SUDAH_PRESENSI');
      }

      transaction.set(izinRef, {
        sesiId,
        kelasId,
        uid,
        alasan: alasanBersih,
        statusIzin: 'MENUNGGU',
        diperiksaOleh: null,
        waktuPeriksa: null,
        kategoriAi: null,
        statusAi: 'BELUM',
        modelAi: null,
        waktuAi: null,
        dibuatPada: serverTimestamp(),
      });
    });

    const hasilSnap = await getDoc(izinRef);
    if (!hasilSnap.exists()) {
      return gagal('JARINGAN', 'Pengajuan belum dapat dikonfirmasi dari server.');
    }

    return {
      ok: true,
      data: petakanIzin(idIzin, hasilSnap.data() as Record<string, unknown>),
    };
  } catch (error) {
    const kode = pesanError(error);

    const pesan: Record<string, string> = {
      DATA_TIDAK_DITEMUKAN: 'Sesi tidak ditemukan.',
      BUKAN_ANGGOTA: 'Kamu bukan anggota aktif kelas ini.',
      DATA_DIARSIPKAN: 'Kelas atau sesi sudah diarsipkan.',
      SUDAH_DITUTUP: 'Sesi sudah ditutup. Pengajuan izin tidak dapat dilakukan.',
      SUDAH_ADA_IZIN: 'Kamu sudah pernah mengajukan izin pada sesi ini.',
      SUDAH_PRESENSI: 'Kamu sudah melakukan presensi pada sesi ini.',
      'firestore/permission-denied': 'Pengajuan ditolak oleh aturan keamanan Firestore.',
    };

    const alasan: AlasanGagal = kode in pesan ? kode as AlasanGagal : 'JARINGAN';

    return gagal(alasan, pesan[kode] ?? 'Pengajuan izin gagal. Periksa koneksi lalu coba lagi.');
  }
}

export async function putuskanIzin(
  idIzin: string,
  status: 'DISETUJUI' | 'DITOLAK',
): Promise<Hasil> {
  void idIzin;
  void status;

  return {
    ok: false,
    alasan: 'TIDAK_DIKENAL',
    pesan: 'Keputusan izin merupakan implementasi B07.',
  };
}

function listenIzin(
  q: ReturnType<typeof query>,
  callback: (data: Izin[]) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map((item) =>
        petakanIzin(item.id, item.data() as Record<string, unknown>),
      );
      callback(data);
    },
    (error) => onError(error),
  );
}

export function listenIzinPengguna(
  uid: string,
  callback: (data: Izin[]) => void,
  onError: (error: Error) => void,
) {
  const { db } = getFirebaseServices();
  const q = query(collection(db, 'izin'), where('uid', '==', uid));
  return listenIzin(q, callback, onError);
}

export function listenIzinSesi(
  sesiId: string,
  callback: (data: Izin[]) => void,
  onError: (error: Error) => void,
) {
  const { db } = getFirebaseServices();
  const q = query(collection(db, 'izin'), where('sesiId', '==', sesiId));
  return listenIzin(q, callback, onError);
}

export function listenIzinKelas(
  kelasId: string,
  callback: (data: Izin[]) => void,
  onError: (error: Error) => void,
) {
  const { db } = getFirebaseServices();
  const q = query(collection(db, 'izin'), where('kelasId', '==', kelasId));
  return listenIzin(q, callback, onError);
}
