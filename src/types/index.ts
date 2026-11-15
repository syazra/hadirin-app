
// Kontrak Data v1.1 — Hadir.in Sprint 2

export type Peran = 'PRAKTIKAN' | 'ASISTEN';

export type StatusSesi =
  | 'BELUM_DIBUKA'
  | 'DIBUKA'
  | 'DITUTUP';

export type StatusKeanggotaan =
  | 'AKTIF'
  | 'NONAKTIF';

export type StatusIzin =
  | 'MENUNGGU'
  | 'DISETUJUI'
  | 'DITOLAK';

export type StatusAi =
  | 'BELUM'
  | 'SUKSES'
  | 'GAGAL';

export type KategoriIzin =
  | 'KESEHATAN'
  | 'KELUARGA'
  | 'AKADEMIK'
  | 'LAINNYA'
  | 'TIDAK_JELAS';

export type StatusRekap =
  | 'HADIR'
  | 'IZIN'
  | 'BELUM_HADIR';

export type AlasanGagal =
  | 'BELUM_DIBUKA'
  | 'SUDAH_DITUTUP'
  | 'SUDAH_PRESENSI'
  | 'QR_TIDAK_VALID'
  | 'BUKAN_ANGGOTA'
  | 'ADA_IZIN'
  | 'SUDAH_HADIR'
  | 'SUDAH_ADA_IZIN'
  | 'SUDAH_DIPUTUSKAN'
  | 'DATA_TIDAK_DITEMUKAN'
  | 'TIDAK_BERWENANG'
  | 'INPUT_TIDAK_VALID'
  | 'PESERTA_SUDAH_AKTIF'
  | 'DATA_DIARSIPKAN'
  | 'PROFIL_BELUM_LENGKAP'
  | 'AUTENTIKASI_GAGAL'
  | 'JARINGAN'
  | 'TIMEOUT'
  | 'KUOTA_HABIS'
  | 'RESPONS_TIDAK_VALID'
  | 'TIDAK_DIKENAL';

export type Hasil<T = void> =
  | { ok: true; data: T }
  | { ok: false; alasan: AlasanGagal; pesan: string };

export interface Pengguna {
  uid: string;
  nama: string;
  nim: string;
  email: string;
  peran: Peran;
  kodePeserta: string;
  dibuatPada: Date | null;
}

export interface Kelas {
  idKelas: string;
  namaPraktikum: string;
  asistenUid: string;
  diarsipkan: boolean;
  dibuatPada: Date | null;
}

export interface Keanggotaan {
  idKeanggotaan: string;
  kelasId: string;
  uid: string;
  nama: string;
  nim: string;
  status: StatusKeanggotaan;
}

export interface Sesi {
  idSesi: string;
  kelasId: string;
  judul: string;
  lokasi: string;
  waktuMulai: Date;
  waktuSelesai: Date | null;
  statusSesi: StatusSesi;
  diarsipkan: boolean;
}

export interface Presensi {
  idPresensi: string;
  sesiId: string;
  kelasId: string;
  uid: string;
  waktuHadir: Date | null;
}

export interface Izin {
  idIzin: string;
  sesiId: string;
  kelasId: string;
  uid: string;
  alasan: string;
  statusIzin: StatusIzin;
  diperiksaOleh: string | null;
  waktuPeriksa: Date | null;
  kategoriAi: KategoriIzin | null;
  statusAi: StatusAi;
  modelAi: string | null;
  waktuAi: Date | null;
  dibuatPada: Date | null;
}