export const BATAS_ALASAN_IZIN = 2000;

export function validasiAlasanIzin(alasan: string): string | null {
  const nilai = alasan.trim();

  if (!nilai) return 'Alasan izin wajib diisi.';

  if (nilai.length > BATAS_ALASAN_IZIN) {
    return `Alasan izin maksimal ${BATAS_ALASAN_IZIN} karakter.`;
  }

  return null;
}
