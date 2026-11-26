import { DATA_PENGGUNA } from './pengguna';

export interface SeedKeanggotaan {
  idKeanggotaan: string;
  kelasId: string;
  uid: string;
  nama: string;
  nim: string;
  status: 'AKTIF' | 'NONAKTIF';
}

const SEMUA_PRAKTIKAN = DATA_PENGGUNA.filter((u) => u.peran === 'PRAKTIKAN');

// Semua 22 praktikan masuk ke kelas-ppk-d1-26
const ANGGOTA_PPK_D1: SeedKeanggotaan[] = SEMUA_PRAKTIKAN.map((p) => ({
  idKeanggotaan: `kelas-ppk-d1-26_${p.uid}`,
  kelasId: 'kelas-ppk-d1-26',
  uid: p.uid,
  nama: p.nama,
  nim: p.nim,
  status: 'AKTIF',
}));

export const DATA_KEANGGOTAAN: SeedKeanggotaan[] = [
  ...ANGGOTA_PPK_D1,

  // Syafira Azka Ramadhani (praktikan-10) terdaftar di banyak kelas (>5 kelas)
  {
    idKeanggotaan: 'kelas-ppk-a2-26_praktikan-10',
    kelasId: 'kelas-ppk-a2-26',
    uid: 'praktikan-10',
    nama: 'Syafira Azka Ramadhani',
    nim: '24060124130088',
    status: 'AKTIF',
  },
  {
    idKeanggotaan: 'kelas-pbo-a1-26_praktikan-10',
    kelasId: 'kelas-pbo-a1-26',
    uid: 'praktikan-10',
    nama: 'Syafira Azka Ramadhani',
    nim: '24060124130088',
    status: 'AKTIF',
  },
  {
    idKeanggotaan: 'kelas-basdat-d2-26_praktikan-10',
    kelasId: 'kelas-basdat-d2-26',
    uid: 'praktikan-10',
    nama: 'Syafira Azka Ramadhani',
    nim: '24060124130088',
    status: 'AKTIF',
  },
  {
    idKeanggotaan: 'kelas-ml-c1-26_praktikan-10',
    kelasId: 'kelas-ml-c1-26',
    uid: 'praktikan-10',
    nama: 'Syafira Azka Ramadhani',
    nim: '24060124130088',
    status: 'AKTIF',
  },
  {
    idKeanggotaan: 'kelas-so-a2-26_praktikan-10',
    kelasId: 'kelas-so-a2-26',
    uid: 'praktikan-10',
    nama: 'Syafira Azka Ramadhani',
    nim: '24060124130088',
    status: 'AKTIF',
  },
  {
    idKeanggotaan: 'kelas-jarkom-c1-26_praktikan-10',
    kelasId: 'kelas-jarkom-c1-26',
    uid: 'praktikan-10',
    nama: 'Syafira Azka Ramadhani',
    nim: '24060124130088',
    status: 'AKTIF',
  },
  {
    idKeanggotaan: 'kelas-strukdat-c2-25_praktikan-10',
    kelasId: 'kelas-strukdat-c2-25',
    uid: 'praktikan-10',
    nama: 'Syafira Azka Ramadhani',
    nim: '24060124130088',
    status: 'NONAKTIF',
  },

  // Tambahan praktikan lain di kelas pendukung
  {
    idKeanggotaan: 'kelas-ppk-a2-26_praktikan-01',
    kelasId: 'kelas-ppk-a2-26',
    uid: 'praktikan-01',
    nama: 'Romualdus Yoas Wicaksono',
    nim: '24060124120046',
    status: 'AKTIF',
  },
  {
    idKeanggotaan: 'kelas-ppk-b2-26_praktikan-04',
    kelasId: 'kelas-ppk-b2-26',
    uid: 'praktikan-04',
    nama: 'Yustinus Hendi S',
    nim: '24060124130114',
    status: 'AKTIF',
  },
  {
    idKeanggotaan: 'kelas-ppk-b2-26_praktikan-09',
    kelasId: 'kelas-ppk-b2-26',
    uid: 'praktikan-09',
    nama: 'Ruth Septriana Sipangkar',
    nim: '24060124120024',
    status: 'AKTIF',
  },
  {
    idKeanggotaan: 'kelas-jarkom-c1-26_praktikan-03',
    kelasId: 'kelas-jarkom-c1-26',
    uid: 'praktikan-03',
    nama: 'Syuraih Umar Khotthob',
    nim: '24060124130092',
    status: 'AKTIF',
  },
  {
    idKeanggotaan: 'kelas-jarkom-d1-26_praktikan-06',
    kelasId: 'kelas-jarkom-d1-26',
    uid: 'praktikan-06',
    nama: 'Anggita Kirana Puspa',
    nim: '24060124130064',
    status: 'AKTIF',
  },
];