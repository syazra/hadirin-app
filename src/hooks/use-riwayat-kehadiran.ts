import { useApp } from '@/hooks/use-app';
import type { ItemRiwayatKehadiran } from '@/types';

export function useRiwayatKehadiran(
  idPengguna: string,
): ItemRiwayatKehadiran[] {
  const { sesi, getRiwayatPengguna } = useApp();
  const riwayat = getRiwayatPengguna(idPengguna);

  return sesi.map((itemSesi) => ({
    sesi: itemSesi,
    presensi: riwayat.find((item) => item.idSesi === itemSesi.idSesi) ?? null,
  }));
}
