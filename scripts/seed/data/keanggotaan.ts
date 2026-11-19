import type { StatusKeanggotaan } from '../../../src/types';

export interface SeedKeanggotaan {
  idKeanggotaan: string;
  kelasId: string;
  uid: string;
  nama: string;
  nim: string;
  status: StatusKeanggotaan;
}

export const DATA_KEANGGOTAAN: SeedKeanggotaan[] = [
  // Kelas PPB-A (8 praktikan: 7 AKTIF, 1 NONAKTIF)
  {
    idKeanggotaan: 'seed-kelas-ppb-a_seed-praktikan-01',
    kelasId: 'seed-kelas-ppb-a',
    uid: 'seed-praktikan-01',
    nama: 'Dimas Aditya (Seed Praktikan 1)',
    nim: '24060124120101',
    status: 'AKTIF',
  },
  {
    idKeanggotaan: 'seed-kelas-ppb-a_seed-praktikan-02',
    kelasId: 'seed-kelas-ppb-a',
    uid: 'seed-praktikan-02',
    nama: 'Salsa Maharani (Seed Praktikan 2)',
    nim: '24060124130102',
    status: 'AKTIF',
  },
  {
    idKeanggotaan: 'seed-kelas-ppb-a_seed-praktikan-03',
    kelasId: 'seed-kelas-ppb-a',
    uid: 'seed-praktikan-03',
    nama: 'Fajar Nugroho (Seed Praktikan 3)',
    nim: '24060124140103',
    status: 'AKTIF',
  },
  {
    idKeanggotaan: 'seed-kelas-ppb-a_seed-praktikan-04',
    kelasId: 'seed-kelas-ppb-a',
    uid: 'seed-praktikan-04',
    nama: 'Alya Ramadhani (Seed Praktikan 4)',
    nim: '24060124120104',
    status: 'AKTIF',
  },
  {
    idKeanggotaan: 'seed-kelas-ppb-a_seed-praktikan-05',
    kelasId: 'seed-kelas-ppb-a',
    uid: 'seed-praktikan-05',
    nama: 'Rizky Maulana (Seed Praktikan 5)',
    nim: '24060124130105',
    status: 'AKTIF',
  },
  {
    idKeanggotaan: 'seed-kelas-ppb-a_seed-praktikan-06',
    kelasId: 'seed-kelas-ppb-a',
    uid: 'seed-praktikan-06',
    nama: 'Zahra Khairunnisa (Seed Praktikan 6)',
    nim: '24060124140106',
    status: 'AKTIF',
  },
  {
    idKeanggotaan: 'seed-kelas-ppb-a_seed-praktikan-07',
    kelasId: 'seed-kelas-ppb-a',
    uid: 'seed-praktikan-07',
    nama: 'Ilham Kurniawan (Seed Praktikan 7)',
    nim: '24060124120107',
    status: 'AKTIF',
  },
  {
    idKeanggotaan: 'seed-kelas-ppb-a_seed-praktikan-08',
    kelasId: 'seed-kelas-ppb-a',
    uid: 'seed-praktikan-08',
    nama: 'Tiara Puspita (Seed Praktikan 8)',
    nim: '24060124130108',
    status: 'NONAKTIF',
  },

  // Kelas ML-A (4 praktikan)
  {
    idKeanggotaan: 'seed-kelas-ml-a_seed-praktikan-01',
    kelasId: 'seed-kelas-ml-a',
    uid: 'seed-praktikan-01',
    nama: 'Dimas Aditya (Seed Praktikan 1)',
    nim: '24060124120101',
    status: 'AKTIF',
  },
  {
    idKeanggotaan: 'seed-kelas-ml-a_seed-praktikan-02',
    kelasId: 'seed-kelas-ml-a',
    uid: 'seed-praktikan-02',
    nama: 'Salsa Maharani (Seed Praktikan 2)',
    nim: '24060124130102',
    status: 'AKTIF',
  },
  {
    idKeanggotaan: 'seed-kelas-ml-a_seed-praktikan-05',
    kelasId: 'seed-kelas-ml-a',
    uid: 'seed-praktikan-05',
    nama: 'Rizky Maulana (Seed Praktikan 5)',
    nim: '24060124130105',
    status: 'AKTIF',
  },
  {
    idKeanggotaan: 'seed-kelas-ml-a_seed-praktikan-06',
    kelasId: 'seed-kelas-ml-a',
    uid: 'seed-praktikan-06',
    nama: 'Zahra Khairunnisa (Seed Praktikan 6)',
    nim: '24060124140106',
    status: 'AKTIF',
  },

  // Kelas JARKOM-C (2 praktikan)
  {
    idKeanggotaan: 'seed-kelas-jarkom-c_seed-praktikan-03',
    kelasId: 'seed-kelas-jarkom-c',
    uid: 'seed-praktikan-03',
    nama: 'Fajar Nugroho (Seed Praktikan 3)',
    nim: '24060124140103',
    status: 'AKTIF',
  },
  {
    idKeanggotaan: 'seed-kelas-jarkom-c_seed-praktikan-04',
    kelasId: 'seed-kelas-jarkom-c',
    uid: 'seed-praktikan-04',
    nama: 'Alya Ramadhani (Seed Praktikan 4)',
    nim: '24060124120104',
    status: 'AKTIF',
  },

  // Kelas RPL-B (2 praktikan)
  {
    idKeanggotaan: 'seed-kelas-rpl-b_seed-praktikan-07',
    kelasId: 'seed-kelas-rpl-b',
    uid: 'seed-praktikan-07',
    nama: 'Ilham Kurniawan (Seed Praktikan 7)',
    nim: '24060124120107',
    status: 'AKTIF',
  },
  {
    idKeanggotaan: 'seed-kelas-rpl-b_seed-praktikan-08',
    kelasId: 'seed-kelas-rpl-b',
    uid: 'seed-praktikan-08',
    nama: 'Tiara Puspita (Seed Praktikan 8)',
    nim: '24060124130108',
    status: 'AKTIF',
  },
];