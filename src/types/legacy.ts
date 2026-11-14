// Kontrak bersama Lampiran A.4. Perubahan perlu dikoordinasikan dengan tim.
export type Peran = 'PRAKTIKAN' | 'ASISTEN';
export type StatusSesi = 'BELUM_DIBUKA' | 'DIBUKA' | 'DITUTUP';
export type AlasanGagal =
  | 'BELUM_DIBUKA'
  | 'SUDAH_DITUTUP'
  | 'SUDAH_PRESENSI'
  | 'QR_TIDAK_VALID';

export interface Pengguna {
  idPengguna: string;
  nama: string;
  peran: Peran;
}

export interface Sesi {
  idSesi: string;
  namaPraktikum: string;
  kelasLab: string;
  waktu: string;
  statusSesi: StatusSesi;
  kodeQr: string;
}

export interface Presensi {
  idPresensi: string;
  idSesi: string;
  idPengguna: string;
  waktuHadir: string;
}

export interface HasilPresensi {
  ok: boolean;
  alasan: AlasanGagal | null;
}

export interface AppState {
  pengguna: Pengguna[];
  penggunaAktif: Pengguna | null;
  sesi: Sesi[];
  presensi: Presensi[];
}

export interface AppContextValue extends AppState {
  pilihIdentitas: (idPengguna: string) => void;
  gantiPeran: () => void;
  bukaSesi: (idSesi: string) => void;
  tutupSesi: (idSesi: string) => void;
  catatPresensi: (idSesi: string, idPengguna: string) => HasilPresensi;
  catatPresensiDariQr: (payloadQr: string, idPengguna: string) => HasilPresensi;
  getSesiById: (id: string) => Sesi | undefined;
  getPresensiBySesi: (id: string) => Presensi[];
  getRiwayatPengguna: (idPengguna: string) => Presensi[];
  sudahPresensi: (idSesi: string, idPengguna: string) => boolean;
}

export interface ItemRekapSesi {
  pengguna: Pengguna;
  presensi: Presensi;
}

export interface RekapSesi {
  daftarHadir: ItemRekapSesi[];
  jumlahHadir: number;
}

export interface ItemRiwayatKehadiran {
  sesi: Sesi;
  presensi: Presensi | null;
}
