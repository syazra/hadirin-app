import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy } from '@react-native-firebase/firestore';
import { getFirebaseServices, isFirebaseAvailable } from '@/lib/firebase';
import type { Laboratorium, Hasil } from '@/types';

type InputLab = Omit<Laboratorium, 'idLab'>;
const KOLEKSI = 'laboratorium';

function gagal(error: unknown): Hasil<never> {
  return { ok: false, alasan: 'TIDAK_DIKENAL', pesan: error instanceof Error ? error.message : 'Terjadi kesalahan.' };
}

function validasi(data: InputLab): string | null {
  if (!data.kodeLab.trim() || !data.nama.trim() || !data.lokasiGedung.trim()) return 'Kode, nama, dan lokasi wajib diisi.';
  if (!Number.isFinite(data.latitude) || data.latitude < -90 || data.latitude > 90) return 'Latitude tidak valid.';
  if (!Number.isFinite(data.longitude) || data.longitude < -180 || data.longitude > 180) return 'Longitude tidak valid.';
  if (!Number.isFinite(data.radiusPresensi) || data.radiusPresensi <= 0) return 'Radius harus lebih dari 0.';
  return null;
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
    const { db } = getFirebaseServices();
    const ref = await addDoc(collection(db, KOLEKSI), { ...data, kodeLab: data.kodeLab.trim().toUpperCase(), nama: data.nama.trim(), lokasiGedung: data.lokasiGedung.trim() });
    return { ok: true, data: ref.id };
  } catch (error) { return gagal(error); }
}

export async function ubahLaboratorium(idLab: string, data: InputLab): Promise<Hasil<void>> {
  const pesan = validasi(data);
  if (pesan) return { ok: false, alasan: 'INPUT_TIDAK_VALID', pesan };
  try {
    const { db } = getFirebaseServices();
    await updateDoc(doc(db, KOLEKSI, idLab), { ...data, kodeLab: data.kodeLab.trim().toUpperCase(), nama: data.nama.trim(), lokasiGedung: data.lokasiGedung.trim() });
    return { ok: true, data: undefined };
  } catch (error) { return gagal(error); }
}

export async function hapusLaboratorium(idLab: string): Promise<Hasil<void>> {
  try {
    const { db } = getFirebaseServices();
    await deleteDoc(doc(db, KOLEKSI, idLab));
    return { ok: true, data: undefined };
  } catch (error) { return gagal(error); }
}
