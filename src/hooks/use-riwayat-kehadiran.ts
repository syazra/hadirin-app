import { useApp } from '@/hooks/use-app';
import type { ItemRiwayatKehadiran } from '@/types';

export function useRiwayatKehadiran(idPengguna: string): ItemRiwayatKehadiran[] {
  const { sesi, getRiwayatPengguna } = useApp();
  const riwayat = getRiwayatPengguna(idPengguna);

  const hasil: ItemRiwayatKehadiran[] = [];

  for (const presensi of riwayat) {
    const itemSesi = sesi.find((item) => item.idSesi === presensi.idSesi);
    if (itemSesi) hasil.push({ sesi: itemSesi, presensi });
  }

  return hasil.sort((a, b) => new Date(b.presensi!.waktuHadir).getTime() - new Date(a.presensi!.waktuHadir).getTime());
}
