import { useApp } from '@/hooks/use-app';
import type { ItemRekapSesi, RekapSesi } from '@/types';

export function useRekapSesi(idSesi: string): RekapSesi {
  const { pengguna, getPresensiBySesi } = useApp();

  const daftarHadir: ItemRekapSesi[] = getPresensiBySesi(idSesi)
    .flatMap((presensi) => {
      const user = pengguna.find(
        (item) => item.idPengguna === presensi.idPengguna,
      );

      return user ? [{ pengguna: user, presensi }] : [];
    });

  return { daftarHadir, jumlahHadir: daftarHadir.length };
}
