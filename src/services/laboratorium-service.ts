import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from '@react-native-firebase/firestore';

import { BATAS_LABORATORIUM } from '@/constants/laboratorium';
import { getFirebaseServices, isFirebaseAvailable } from '@/lib/firebase';
import type { AlasanGagal, Hasil, Laboratorium } from '@/types';

export type InputLab = Omit<Laboratorium, 'idLab'>;

const KOLEKSI = 'laboratorium';

function gagal(error: unknown): Hasil<never> {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const kode = String((error as { code?: unknown }).code).replace(/^firestore\//, '');
    const map: Record<string, { alasan: AlasanGagal; pesan: string }> = {
      'permission-denied': {
        alasan: 'TIDAK_BERWENANG',
        pesan: 'Hanya asisten yang memiliki izin untuk mengelola data laboratorium.',
      },
      unauthenticated: {
        alasan: 'AUTENTIKASI_GAGAL',
        pesan: 'Sesi login Anda telah berakhir. Silakan masuk kembali.',
      },
      unavailable: {
        alasan: 'JARINGAN',
        pesan: 'Koneksi ke server terganggu. Periksa jaringan Anda lalu coba lagi.',
      },
      'network-request-failed': {
        alasan: 'JARINGAN',
        pesan: 'Koneksi ke server terganggu. Periksa jaringan Anda lalu coba lagi.',
      },
      'deadline-exceeded': {
        alasan: 'TIMEOUT',
        pesan: 'Permintaan melebihi batas waktu. Silakan coba lagi.',
      },
    };
    if (kode in map) {
      return { ok: false, ...map[kode] };
    }
  }
  return {
    ok: false,
    alasan: 'TIDAK_DIKENAL',
    pesan: error instanceof Error ? error.message : 'Terjadi kesalahan.',
  };
}

export function validasiLaboratorium(data: InputLab): string | null {
  const kodeLab = data.kodeLab.trim();
  const nama = data.nama.trim();
  const lokasiGedung = data.lokasiGedung.trim();

  if (!kodeLab || !nama || !lokasiGedung) {
    return 'Kode, nama, dan lokasi wajib diisi.';
  }
  if (kodeLab.length > BATAS_LABORATORIUM.PANJANG_MAKS_KODE) {
    return `Kode laboratorium maksimal ${BATAS_LABORATORIUM.PANJANG_MAKS_KODE} karakter.`;
  }
  if (nama.length > BATAS_LABORATORIUM.PANJANG_MAKS_NAMA) {
    return `Nama laboratorium maksimal ${BATAS_LABORATORIUM.PANJANG_MAKS_NAMA} karakter.`;
  }
  if (lokasiGedung.length > BATAS_LABORATORIUM.PANJANG_MAKS_GEDUNG) {
    return `Lokasi gedung maksimal ${BATAS_LABORATORIUM.PANJANG_MAKS_GEDUNG} karakter.`;
  }
  if (
    !Number.isFinite(data.latitude) ||
    data.latitude < BATAS_LABORATORIUM.LATITUDE_MIN ||
    data.latitude > BATAS_LABORATORIUM.LATITUDE_MAKS
  ) {
    return 'Latitude tidak valid.';
  }
  if (
    !Number.isFinite(data.longitude) ||
    data.longitude < BATAS_LABORATORIUM.LONGITUDE_MIN ||
    data.longitude > BATAS_LABORATORIUM.LONGITUDE_MAKS
  ) {
    return 'Longitude tidak valid.';
  }
  if (
    !Number.isFinite(data.radiusPresensi) ||
    data.radiusPresensi < BATAS_LABORATORIUM.RADIUS_MIN_METER ||
    data.radiusPresensi > BATAS_LABORATORIUM.RADIUS_MAKS_METER
  ) {
    return `Radius harus antara ${BATAS_LABORATORIUM.RADIUS_MIN_METER} dan ${BATAS_LABORATORIUM.RADIUS_MAKS_METER} meter.`;
  }
  if (typeof data.aktif !== 'boolean') {
    return 'Status aktif laboratorium tidak valid.';
  }
  return null;
}

function payloadDokumen(data: InputLab): InputLab {
  return {
    kodeLab: data.kodeLab.trim().toUpperCase(),
    nama: data.nama.trim(),
    lokasiGedung: data.lokasiGedung.trim(),
    latitude: data.latitude,
    longitude: data.longitude,
    radiusPresensi: data.radiusPresensi,
    aktif: data.aktif,
  };
}

async function cekDuplikatKode(kodeLab: string, kecualiIdLab?: string): Promise<boolean> {
  const { db } = getFirebaseServices();
  const snap = await getDocs(
    query(collection(db, KOLEKSI), where('kodeLab', '==', kodeLab)),
  );
  return snap.docs.some((d) => (kecualiIdLab ? d.id !== kecualiIdLab : true));
}

export async function ambilLaboratorium(): Promise<Hasil<Laboratorium[]>> {
  try {
    if (!isFirebaseAvailable) {
      return { ok: false, alasan: 'TIDAK_DIKENAL', pesan: 'Firebase hanya tersedia di Android.' };
    }
    const { db } = getFirebaseServices();
    const snapshot = await getDocs(query(collection(db, KOLEKSI), orderBy('kodeLab')));
    return {
      ok: true,
      data: snapshot.docs.map((item) => ({ ...item.data(), idLab: item.id } as Laboratorium)),
    };
  } catch (error) {
    return gagal(error);
  }
}

export async function tambahLaboratorium(data: InputLab): Promise<Hasil<string>> {
  const pesan = validasiLaboratorium(data);
  if (pesan) return { ok: false, alasan: 'INPUT_TIDAK_VALID', pesan };
  try {
    if (!isFirebaseAvailable) {
      return { ok: false, alasan: 'TIDAK_DIKENAL', pesan: 'Firebase hanya tersedia di Android.' };
    }
    const payload = payloadDokumen(data);
    if (await cekDuplikatKode(payload.kodeLab)) {
      return {
        ok: false,
        alasan: 'INPUT_TIDAK_VALID',
        pesan: `Kode laboratorium "${payload.kodeLab}" sudah terdaftar.`,
      };
    }
    const { db } = getFirebaseServices();
    const ref = await addDoc(collection(db, KOLEKSI), payload);
    return { ok: true, data: ref.id };
  } catch (error) {
    return gagal(error);
  }
}

export async function ubahLaboratorium(idLab: string, data: InputLab): Promise<Hasil<void>> {
  if (!idLab.trim()) {
    return { ok: false, alasan: 'INPUT_TIDAK_VALID', pesan: 'ID laboratorium tidak valid.' };
  }
  const pesan = validasiLaboratorium(data);
  if (pesan) return { ok: false, alasan: 'INPUT_TIDAK_VALID', pesan };
  try {
    if (!isFirebaseAvailable) {
      return { ok: false, alasan: 'TIDAK_DIKENAL', pesan: 'Firebase hanya tersedia di Android.' };
    }
    const payload = payloadDokumen(data);
    if (await cekDuplikatKode(payload.kodeLab, idLab)) {
      return {
        ok: false,
        alasan: 'INPUT_TIDAK_VALID',
        pesan: `Kode laboratorium "${payload.kodeLab}" sudah digunakan laboratorium lain.`,
      };
    }
    const { db } = getFirebaseServices();
    await updateDoc(doc(db, KOLEKSI, idLab), payload);
    return { ok: true, data: undefined };
  } catch (error) {
    return gagal(error);
  }
}

export async function cekRelasiAktifLaboratorium(idLab: string): Promise<{
  adaRelasiAktif: boolean;
  jumlahKelasAktif: number;
  jumlahSesiAktif: number;
}> {
  const { db } = getFirebaseServices();

  const kelasQuery = query(
    collection(db, 'kelas'),
    where('diarsipkan', '==', false),
    where('labId', '==', idLab),
  );

  const sesiQuery = query(
    collection(db, 'sesi'),
    where('diarsipkan', '==', false),
    where('labId', '==', idLab),
  );

  const [kelasSnap, sesiSnap] = await Promise.all([
    getDocs(kelasQuery),
    getDocs(sesiQuery),
  ]);

  const jumlahKelasAktif = kelasSnap.docs.length;
  const jumlahSesiAktif = sesiSnap.docs.filter(
    (d) => d.data()?.statusSesi !== 'DITUTUP',
  ).length;

  return {
    adaRelasiAktif: jumlahKelasAktif > 0 || jumlahSesiAktif > 0,
    jumlahKelasAktif,
    jumlahSesiAktif,
  };
}

export async function hapusLaboratorium(idLab: string): Promise<Hasil<void>> {
  if (!idLab.trim()) {
    return { ok: false, alasan: 'INPUT_TIDAK_VALID', pesan: 'ID laboratorium tidak valid.' };
  }
  try {
    if (!isFirebaseAvailable) {
      return { ok: false, alasan: 'TIDAK_DIKENAL', pesan: 'Firebase hanya tersedia di Android.' };
    }
    const { auth, db } = getFirebaseServices();
    const uid = auth.currentUser?.uid;
    if (!uid) {
      return {
        ok: false,
        alasan: 'AUTENTIKASI_GAGAL',
        pesan: 'Sesi login Anda telah berakhir. Silakan masuk kembali.',
      };
    }

    const relasi = await cekRelasiAktifLaboratorium(idLab);
    if (relasi.adaRelasiAktif) {
      return {
        ok: false,
        alasan: 'INPUT_TIDAK_VALID',
        pesan: `Laboratorium tidak dapat dihapus karena masih digunakan oleh ${relasi.jumlahKelasAktif} kelas aktif dan ${relasi.jumlahSesiAktif} sesi aktif/terjadwal. Nonaktifkan laboratorium jika tidak ingin dipakai lagi.`,
      };
    }
    await deleteDoc(doc(db, KOLEKSI, idLab));
    return { ok: true, data: undefined };
  } catch (error) {
    const rawKode =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code?: unknown }).code)
        : 'unknown';
    const detail = error instanceof Error ? error.message : String(error);
    console.error('[hapusLaboratorium error]', rawKode, detail);

    const mapped = gagal(error);
    if (!mapped.ok) {
      return {
        ...mapped,
        pesan: `${mapped.pesan} (${rawKode})`,
      };
    }
    return mapped;
  }
}