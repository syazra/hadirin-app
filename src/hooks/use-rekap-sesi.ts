import type { RekapSesi } from '@/types';

// TODO(Binar): turunkan rekap dari useApp; stub bukan data rekap nyata.
export function useRekapSesi(_idSesi: string): RekapSesi {
  return { daftarHadir: [], jumlahHadir: 0 };
}
