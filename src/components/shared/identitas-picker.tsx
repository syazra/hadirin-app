import type { Pengguna } from '@/types';

export interface IdentitasPickerProps {
  pengguna: Pengguna[];
  penggunaAktif: Pengguna | null;
  onPilihIdentitas: (idPengguna: string) => void;
  onGantiPeran: () => void;
}

// TODO(Farhan): pilihan peran/identitas pada Tahap 1b.
export function IdentitasPicker(_props: IdentitasPickerProps) {
  return null;
}
