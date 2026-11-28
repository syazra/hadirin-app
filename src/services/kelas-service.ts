import { getFirebaseServices, isFirebaseAvailable } from '@/lib/firebase';
import type { AlasanGagal, Hasil, Kelas } from '@/types';
import {
    Timestamp,
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from '@react-native-firebase/firestore';

const PANJANG_MAKS_NAMA = 100;
const GRACE_PERIOD_MAKS_MENIT = 120;
const NOMINAL_DENDA_MAKS_RUPIAH = 1_000_000;

export interface KonfigurasiDendaKelas {
  labId?: string | null;
  gracePeriodMenit?: number;
  nominalDenda?: number;
}

function gagal(alasan: AlasanGagal, pesan: string): Hasil {
  return { ok: false, alasan, pesan };
}

function keDate(nilai: unknown): Date | null {
  if (nilai instanceof Timestamp) {
    return nilai.toDate();
  }
  if (
    nilai !== null &&
    typeof nilai === 'object' &&
    'toDate' in nilai &&
    typeof (nilai as { toDate: unknown }).toDate === 'function'
  ) {
    return (nilai as { toDate: () => Date }).toDate();
  }
  return null;
}

function validasiRentangAngka(
  nilai: unknown,
  label: string,
  maks: number,
): string | null {
  if (
    typeof nilai !== 'number' ||
    !Number.isInteger(nilai) ||
    nilai < 0 ||
    nilai > maks
  ) {
    return `${label} harus berupa bilangan bulat antara 0 hingga ${maks.toLocaleString('id-ID')}.`;
  }
  return null;
}

function normalisasiLabId(labId: string | null | undefined): string | null {
  if (typeof labId !== 'string') return null;
  const trimmed = labId.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Memetakan error Firebase/jaringan.
 */
function petakanError(error: unknown): Hasil {
  const rawKode =
    error !== null && typeof error === 'object' && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';
  const kode = rawKode.replace(/^firestore\//, '');

  switch (kode) {
    case 'permission-denied':
      return gagal(
        'TIDAK_BERWENANG',
        'Anda tidak memiliki izin untuk mengelola kelas ini.',
      );
    case 'unauthenticated':
      return gagal(
        'AUTENTIKASI_GAGAL',
        'Sesi login tidak valid. Silakan masuk kembali.',
      );
    case 'not-found':
      return gagal('DATA_TIDAK_DITEMUKAN', 'Data kelas tidak ditemukan.');
    case 'unavailable':
    case 'network-request-failed':
      return gagal(
        'JARINGAN',
        'Koneksi bermasalah. Periksa internet Anda lalu coba lagi.',
      );
    case 'deadline-exceeded':
      return gagal(
        'TIMEOUT',
        'Permintaan melebihi batas waktu. Silakan coba lagi.',
      );
    default:
      return gagal(
        'TIDAK_DIKENAL',
        'Terjadi kesalahan saat memproses data kelas.',
      );
  }
}

/**
 * Menambahkan kelas baru milik asisten yang sedang login.
 */
export async function tambahKelas(
  namaPraktikum: string,
  konfigurasi: KonfigurasiDendaKelas = {},
): Promise<Hasil> {
  if (!isFirebaseAvailable) {
    return gagal(
      'TIDAK_DIKENAL',
      'Firebase Hadir.in saat ini hanya tersedia di Android.',
    );
  }

  const { auth, db } = getFirebaseServices();
  const user = auth.currentUser;
  if (!user) {
    return gagal(
      'AUTENTIKASI_GAGAL',
      'Anda harus login terlebih dahulu untuk menambah kelas.',
    );
  }

  const nama = namaPraktikum.trim();
  if (nama.length === 0) {
    return gagal('INPUT_TIDAK_VALID', 'Nama praktikum wajib diisi.');
  }
  if (nama.length > PANJANG_MAKS_NAMA) {
    return gagal(
      'INPUT_TIDAK_VALID',
      `Nama praktikum maksimal ${PANJANG_MAKS_NAMA} karakter.`,
    );
  }

  const gracePeriodMenit = konfigurasi.gracePeriodMenit ?? 0;
  const nominalDenda = konfigurasi.nominalDenda ?? 0;
  const labId = normalisasiLabId(konfigurasi.labId);

  const errGrace = validasiRentangAngka(
    gracePeriodMenit,
    'Grace period (menit)',
    GRACE_PERIOD_MAKS_MENIT,
  );
  if (errGrace) {
    return gagal('INPUT_TIDAK_VALID', errGrace);
  }

  const errDenda = validasiRentangAngka(
    nominalDenda,
    'Nominal denda',
    NOMINAL_DENDA_MAKS_RUPIAH,
  );
  if (errDenda) {
    return gagal('INPUT_TIDAK_VALID', errDenda);
  }

  try {
    await addDoc(collection(db, 'kelas'), {
      namaPraktikum: nama,
      asistenUid: user.uid,
      labId,
      gracePeriodMenit,
      nominalDenda,
      diarsipkan: false,
      dibuatPada: serverTimestamp(),
      diperbaruiPada: serverTimestamp(),
    });
    return { ok: true, data: undefined };
  } catch (error) {
    return petakanError(error);
  }
}

/**
 * Mengubah data kelas (namaPraktikum, labId, konfigurasi denda, dan/atau arsip satu arah false -> true).
 */
export async function ubahKelas(
  idKelas: string,
  data: Partial<
    Pick<
      Kelas,
      | 'namaPraktikum'
      | 'labId'
      | 'gracePeriodMenit'
      | 'nominalDenda'
      | 'diarsipkan'
    >
  >,
): Promise<Hasil> {
  if (!isFirebaseAvailable) {
    return gagal(
      'TIDAK_DIKENAL',
      'Firebase Hadir.in saat ini hanya tersedia di Android.',
    );
  }

  const { auth, db } = getFirebaseServices();
  const user = auth.currentUser;
  if (!user) {
    return gagal(
      'AUTENTIKASI_GAGAL',
      'Anda harus login terlebih dahulu untuk mengubah kelas.',
    );
  }

  const id = idKelas.trim();
  if (!id) {
    return gagal('INPUT_TIDAK_VALID', 'ID kelas tidak valid.');
  }

  const payload: Record<string, unknown> = {};

  if (data.namaPraktikum !== undefined) {
    const nama = data.namaPraktikum.trim();
    if (nama.length === 0) {
      return gagal('INPUT_TIDAK_VALID', 'Nama praktikum wajib diisi.');
    }
    if (nama.length > PANJANG_MAKS_NAMA) {
      return gagal(
        'INPUT_TIDAK_VALID',
        `Nama praktikum maksimal ${PANJANG_MAKS_NAMA} karakter.`,
      );
    }
    payload.namaPraktikum = nama;
  }

  if (data.labId !== undefined) {
    payload.labId = normalisasiLabId(data.labId);
  }

  if (data.gracePeriodMenit !== undefined) {
    const errGrace = validasiRentangAngka(
      data.gracePeriodMenit,
      'Grace period (menit)',
      GRACE_PERIOD_MAKS_MENIT,
    );
    if (errGrace) {
      return gagal('INPUT_TIDAK_VALID', errGrace);
    }
    payload.gracePeriodMenit = data.gracePeriodMenit;
  }

  if (data.nominalDenda !== undefined) {
    const errDenda = validasiRentangAngka(
      data.nominalDenda,
      'Nominal denda',
      NOMINAL_DENDA_MAKS_RUPIAH,
    );
    if (errDenda) {
      return gagal('INPUT_TIDAK_VALID', errDenda);
    }
    payload.nominalDenda = data.nominalDenda;
  }

  if (data.diarsipkan !== undefined) {
    if (!data.diarsipkan) {
      return gagal(
        'INPUT_TIDAK_VALID',
        'Kelas yang sudah diarsipkan tidak dapat diaktifkan kembali.',
      );
    }
    payload.diarsipkan = true;
  }

  if (Object.keys(payload).length === 0) {
    return gagal('INPUT_TIDAK_VALID', 'Tidak ada perubahan data kelas.');
  }

  payload.diperbaruiPada = serverTimestamp();

  try {
    const kelasRef = doc(db, 'kelas', id);
    const snap = await getDoc(kelasRef);

    if (!snap.exists()) {
      return gagal('DATA_TIDAK_DITEMUKAN', 'Kelas tidak ditemukan.');
    }

    const kelasSaatIni = snap.data();
    if (!kelasSaatIni || kelasSaatIni.asistenUid !== user.uid) {
      return gagal(
        'TIDAK_BERWENANG',
        'Anda tidak berwenang mengubah kelas ini.',
      );
    }

    if (kelasSaatIni.diarsipkan === true) {
      return gagal(
        'DATA_DIARSIPKAN',
        'Kelas yang sudah diarsipkan tidak dapat diubah.',
      );
    }

    if (payload.diarsipkan === true) {
      const sesiSnap = await getDocs(
        query(collection(db, 'sesi'), where('kelasId', '==', id)),
      );
      const adaSesiDibuka = sesiSnap.docs.some(
        (d) =>
          d.data()?.diarsipkan !== true && d.data()?.statusSesi === 'DIBUKA',
      );
      if (adaSesiDibuka) {
        return gagal(
          'INPUT_TIDAK_VALID',
          'Tutup sesi praktikum yang sedang berlangsung sebelum mengarsipkan kelas.',
        );
      }
    }

    await updateDoc(kelasRef, payload);
    return { ok: true, data: undefined };
  } catch (error) {
    return petakanError(error);
  }
}

/**
 * Mengarsipkan kelas (satu arah: false -> true).
 */
export async function arsipkanKelas(idKelas: string): Promise<Hasil> {
  return ubahKelas(idKelas, { diarsipkan: true });
}

/**
 * Mendengarkan daftar kelas aktif milik asisten secara realtime.
 */
export function listenKelasAsisten(
  uid: string,
  callback: (kelas: Kelas[]) => void,
  onError: (error: Error) => void,
  sertakanArsip = false,
): () => void {
  const uidBersih = uid.trim();
  if (!uidBersih) {
    callback([]);
    return () => {};
  }

  if (!isFirebaseAvailable) {
    onError(
      new Error('Firebase Hadir.in saat ini hanya tersedia di Android.'),
    );
    return () => {};
  }

  const { db } = getFirebaseServices();
  const q = sertakanArsip
    ? query(
        collection(db, 'kelas'),
        where('asistenUid', '==', uidBersih),
      )
    : query(
        collection(db, 'kelas'),
        where('asistenUid', '==', uidBersih),
        where('diarsipkan', '==', false),
      );

  return onSnapshot(
    q,
    (snapshot) => {
      const daftarKelas: Kelas[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          idKelas: docSnap.id,
          namaPraktikum: String(d.namaPraktikum ?? ''),
          asistenUid: String(d.asistenUid ?? ''),
          labId: typeof d.labId === 'string' && d.labId.trim() ? d.labId : null,
          gracePeriodMenit:
            typeof d.gracePeriodMenit === 'number'
              ? d.gracePeriodMenit
              : 0,
          nominalDenda:
            typeof d.nominalDenda === 'number' ? d.nominalDenda : 0,
          diarsipkan: Boolean(d.diarsipkan),
          dibuatPada: keDate(d.dibuatPada),
          diperbaruiPada: keDate(d.diperbaruiPada),
        };
      });

      daftarKelas.sort((a, b) => {
        const waktuA = a.dibuatPada?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const waktuB = b.dibuatPada?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return waktuB - waktuA;
      });

      callback(daftarKelas);
    },
    (error) => {
      onError(error);
    },
  );
}