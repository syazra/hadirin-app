import type { KategoriIzin } from '../types';

export const VERSI_KATEGORI_AI = 'sakit-delegasi-lomba-alpha-v1';

/** Kontrak respons baru; label lama hanya diterima pada pembacaan data tersimpan. */
export function adalahKategoriIzin(nilai: unknown): nilai is KategoriIzin {
  return nilai === 'SAKIT' || nilai === 'IZIN' || nilai === 'ALPHA';
}

export function normalisasiKategoriIzinTersimpan(nilai: unknown): KategoriIzin | null {
  if (adalahKategoriIzin(nilai)) return nilai;
  if (nilai === 'KESEHATAN') return 'SAKIT';
  // Label lama tidak membuktikan adanya lomba/delegasi; perlu klasifikasi ulang.
  return null;
}
