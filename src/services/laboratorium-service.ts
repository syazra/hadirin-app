import { collection, doc, getDocs, addDoc, updateDoc, query, orderBy } from '@react-native-firebase/firestore';
import { getFirebaseServices, isFirebaseAvailable } from '@/lib/firebase';
import type { AlasanGagal, Laboratorium, Hasil } from '@/types';

type InputLab = Omit<Laboratorium, 'idLab'>;
const KOLEKSI = 'laboratorium';

const PANJANG_MAKS_KODE = 32;
const PANJANG_MAKS_NAMA = 100;
const PANJANG_MAKS_GEDUNG = 200;
const RADIUS_MAKS_METER = 10_000;

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
  return { ok: false, alasan: 'TIDAK_DIKENAL', pesan: error instanceof Error ? error.message : 'Terjadi kesalahan.' };
}

function validasi(data: InputLab): string | null {
  const kodeLab = data.kodeLab.trim();
  const nama = data.nama.trim();
  const lokasiGedung = data.lokasiGedung.trim();
  if (!kodeLab || !nama || !lokasiGedung) return 'Kode, nama, dan lokasi wajib diisi.';
  if (kodeLab.length > PANJANG_MAKS_KODE) return `Kode laboratorium maksimal ${PANJANG_MAKS_KODE} karakter.`;
  if (nama.length > PANJANG_MAKS_NAMA) return `Nama laboratorium maksimal ${PANJANG_MAKS_NAMA} karakter.`;
  if (lokasiGedung.length > PANJANG_MAKS_GEDUNG) return `Lokasi gedung maksimal ${PANJANG_MAKS_GEDUNG} karakter.`;
  if (!Number.isFinite(data.latitude) || data.latitude < -90 || data.latitude > 90) return 'Latitude tidak valid.';
  if (!Number.isFinite(data.longitude) || data.longitude < -180 || data.longitude > 180) return 'Longitude tidak valid.';
  if (!Number.isFinite(data.radiusPresensi) || data.radiusPresensi <= 0 || data.radiusPresensi > RADIUS_MAKS_METER) {
    return `Radius harus lebih dari 0 dan maksimal ${RADIUS_MAKS_METER} meter.`;
  }
  if (typeof data.aktif !== 'boolean') return 'Status aktif laboratorium tidak valid.';
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

export async function ambilLaboratorium(): Promise<Hasil<Laboratorium[]>> {
  try {
    if (!isFirebaseAvailable) return { ok: false, alasan: 'TIDAK_DIKENAL', pesan: 'Firebase hanya tersedia di Android.' };
    const { db } = getFirebaseServices();
    const snapshot = await getDocs(query(collection(db, KOLEKSI), orderBy('kodeLab')));
    return { ok: true, data: snapshot.docs.map((item) => ({ ...item.data(), idLab: item.id } as Laboratorium)) };
  } catch (error) { return gagal(error); }
}

export async function tambahLaboratorium(data: InputLab): Promise<Hasil<string>> {
  const pesan = validasi(data);
  if (pesan) return { ok: false, alasan: 'INPUT_TIDAK_VALID', pesan };
  try {
    if (!isFirebaseAvailable) return { ok: false, alasan: 'TIDAK_DIKENAL', pesan: 'Firebase hanya tersedia di Android.' };
    const { db } = getFirebaseServices();
    const ref = await addDoc(collection(db, KOLEKSI), payloadDokumen(data));
    return { ok: true, data: ref.id };
  } catch (error) { return gagal(error); }
}

export async function ubahLaboratorium(idLab: string, data: InputLab): Promise<Hasil<void>> {
  const pesan = validasi(data);
  if (pesan) return { ok: false, alasan: 'INPUT_TIDAK_VALID', pesan };
  try {
    if (!isFirebaseAvailable) return { ok: false, alasan: 'TIDAK_DIKENAL', pesan: 'Firebase hanya tersedia di Android.' };
    const { db } = getFirebaseServices();
    await updateDoc(doc(db, KOLEKSI, idLab), payloadDokumen(data));
    return { ok: true, data: undefined };
  } catch (error) { return gagal(error); }
}
