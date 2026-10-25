import { useApp } from '@/hooks/use-app';
import type { Sesi, Presensi } from '@/types';

type ItemRiwayatValid = {
  sesi: Sesi;
  presensi: Presensi;
};

export function useRiwayatKehadiran(idPengguna: string): ItemRiwayatValid[] {
  const { sesi, getRiwayatPengguna } = useApp();
  const riwayat = getRiwayatPengguna(idPengguna);
  const hasil: ItemRiwayatValid[] = [];

  for (const presensi of riwayat) {
    const itemSesi = sesi.find((item) => item.idSesi === presensi.idSesi);
    if (itemSesi) hasil.push({ sesi: itemSesi, presensi });
  }

  return hasil.sort((a, b) => new Date(b.presensi.waktuHadir).getTime() - new Date(a.presensi.waktuHadir).getTime());
}
