import type { KategoriIzin } from '../types';

/** Kontrak respons baru; label lama hanya diterima pada pembacaan data tersimpan. */
export function adalahKategoriIzin(nilai: unknown): nilai is KategoriIzin {
  return nilai === 'SAKIT' || nilai === 'IZIN';
}

export function normalisasiKategoriIzinTersimpan(nilai: unknown): KategoriIzin | null {
  if (adalahKategoriIzin(nilai)) return nilai;
  if (nilai === 'KESEHATAN') return 'SAKIT';
  if (nilai === 'KELUARGA' || nilai === 'AKADEMIK' || nilai === 'LAINNYA') return 'IZIN';
  return null;
}
