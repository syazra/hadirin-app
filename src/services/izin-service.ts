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
import { normalisasiKategoriIzinTersimpan } from '@/utils/kategori-izin';
import { buatReferensiNotifikasi, catatNotifikasi } from './notification-intent';

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
    kategoriAi: normalisasiKategoriIzinTersimpan(data.kategoriAi),
    versiKategoriAi: typeof data.versiKategoriAi === 'string' ? data.versiKategoriAi : null,
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
    let kelasIdHasil = '';
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
      kelasIdHasil = kelasId;

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


    // Transaksi sudah berhasil. Pembacaan ulang hanya untuk mengambil
    // data server; kegagalan pembacaan tidak boleh dianggap gagal menyimpan.
    const dataFallback: Izin = {
      idIzin,
      sesiId,
      kelasId: kelasIdHasil,
      uid,
      alasan: alasanBersih,
      statusIzin: 'MENUNGGU',
      diperiksaOleh: null,
      waktuPeriksa: null,
      kategoriAi: null,
      statusAi: 'BELUM',
      modelAi: null,
      waktuAi: null,
      dibuatPada: null,
    };

    try {
      const hasilSnap = await getDoc(izinRef);

      if (hasilSnap.exists()) {
        return {
          ok: true,
          data: petakanIzin(
            idIzin,
            hasilSnap.data() as Record<string, unknown>,
          ),
        };
      }
    } catch {
      // Pengajuan sudah berhasil ditulis oleh transaksi.
    }

    return {
      ok: true,
      data: dataFallback,
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
  if (!idIzin || !['DISETUJUI', 'DITOLAK'].includes(status)) {
    return { ok: false, alasan: 'INPUT_TIDAK_VALID', pesan: 'Data keputusan tidak valid.' };
  }

  try {
    const { auth, db } = getFirebaseServices();
    const user = auth.currentUser;
    if (!user) return { ok: false, alasan: 'AUTENTIKASI_GAGAL', pesan: 'Silakan login kembali.' };

    const izinRef = doc(db, 'izin', idIzin);
    const notifikasiRef = buatReferensiNotifikasi(db);
    await runTransaction(db, async (transaction) => {
      const izinSnap = await transaction.get(izinRef);
      if (!izinSnap.exists()) throw new Error('DATA_TIDAK_DITEMUKAN');

      const izin = izinSnap.data();
      if (izin.statusIzin !== 'MENUNGGU') throw new Error('SUDAH_DIPUTUSKAN');

      const sesiRef = doc(db, 'sesi', String(izin.sesiId));
      const sesiSnap = await transaction.get(sesiRef);
      if (!sesiSnap.exists()) throw new Error('DATA_TIDAK_DITEMUKAN');

      const sesi = sesiSnap.data();
      if (String(sesi.kelasId) !== String(izin.kelasId)) throw new Error('TIDAK_BERWENANG');

      const kelasRef = doc(db, 'kelas', String(sesi.kelasId));
      const kelasSnap = await transaction.get(kelasRef);
      if (!kelasSnap.exists()) throw new Error('DATA_TIDAK_DITEMUKAN');

      if (kelasSnap.data().asistenUid !== user.uid) throw new Error('TIDAK_BERWENANG');

      transaction.update(izinRef, {
        statusIzin: status,
        diperiksaOleh: user.uid,
        waktuPeriksa: serverTimestamp(),
        ...catatNotifikasi(transaction, notifikasiRef, idIzin,
          status === 'DISETUJUI' ? 'IZIN_DISETUJUI' : 'IZIN_DITOLAK'),
      });
    });

    return { ok: true, data: undefined };
  } catch (error) {
    const kode = pesanError(error);
    const pesan: Record<string, string> = {
      DATA_TIDAK_DITEMUKAN: 'Data izin, sesi, atau kelas tidak ditemukan.',
      SUDAH_DIPUTUSKAN: 'Pengajuan ini sudah diputuskan sebelumnya.',
      TIDAK_BERWENANG: 'Kamu bukan asisten pemilik kelas ini.',
      'firestore/permission-denied': 'Keputusan ditolak oleh aturan keamanan Firestore.',
    };

    const alasan: AlasanGagal = kode in pesan ? kode as AlasanGagal : 'JARINGAN';
    return { ok: false, alasan, pesan: pesan[kode] ?? 'Keputusan izin gagal disimpan.' };
  }
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
