import type { Peran } from '../../../src/types';

export interface SeedPengguna {
  uid: string;
  nama: string;
  nim: string;
  email: string;
  peran: Peran;
  kodePeserta: string;
}

export const DATA_PENGGUNA: SeedPengguna[] = [
  // Asisten (4)
  {
    uid: 'asisten-01',
    nama: 'Raka Pratama',
    nim: '24060122130001',
    email: 'asisten1@hadirin.test',
    peran: 'ASISTEN',
    kodePeserta: 'AST00001',
  },
  {
    uid: 'asisten-02',
    nama: 'Nadia Kusuma',
    nim: '24060122130002',
    email: 'asisten2@hadirin.test',
    peran: 'ASISTEN',
    kodePeserta: 'AST00002',
  },
  {
    uid: 'asisten-03',
    nama: 'Bagas Wicaksono',
    nim: '24060122130003',
    email: 'asisten3@hadirin.test',
    peran: 'ASISTEN',
    kodePeserta: 'AST00003',
  },
  {
    uid: 'asisten-04',
    nama: 'Salsa Permata',
    nim: '24060122130004',
    email: 'asisten4@hadirin.test',
    peran: 'ASISTEN',
    kodePeserta: 'AST00004',
  },

  // Praktikan (10)
  {
    uid: 'praktikan-01',
    nama: 'Alif Rahman',
    nim: '24060124130101',
    email: 'praktikan1@hadirin.test',
    peran: 'PRAKTIKAN',
    kodePeserta: 'PRK00001',
  },
  {
    uid: 'praktikan-02',
    nama: 'Bima Sakti',
    nim: '24060124130102',
    email: 'praktikan2@hadirin.test',
    peran: 'PRAKTIKAN',
    kodePeserta: 'PRK00002',
  },
  {
    uid: 'praktikan-03',
    nama: 'Citra Lestari',
    nim: '24060124130103',
    email: 'praktikan3@hadirin.test',
    peran: 'PRAKTIKAN',
    kodePeserta: 'PRK00003',
  },
  {
    uid: 'praktikan-04',
    nama: 'Dimas Saputra',
    nim: '24060124130104',
    email: 'praktikan4@hadirin.test',
    peran: 'PRAKTIKAN',
    kodePeserta: 'PRK00004',
  },
  {
    uid: 'praktikan-05',
    nama: 'Eka Putri',
    nim: '24060124130105',
    email: 'praktikan5@hadirin.test',
    peran: 'PRAKTIKAN',
    kodePeserta: 'PRK00005',
  },
  {
    uid: 'praktikan-06',
    nama: 'Faris Nugroho',
    nim: '24060124130106',
    email: 'praktikan6@hadirin.test',
    peran: 'PRAKTIKAN',
    kodePeserta: 'PRK00006',
  },
  {
    uid: 'praktikan-07',
    nama: 'Gita Maharani',
    nim: '24060124130107',
    email: 'praktikan7@hadirin.test',
    peran: 'PRAKTIKAN',
    kodePeserta: 'PRK00007',
  },
  {
    uid: 'praktikan-08',
    nama: 'Tiara Puspita',
    nim: '24060124130108',
    email: 'praktikan8@hadirin.test',
    peran: 'PRAKTIKAN',
    kodePeserta: 'PRK00008',
  },
  {
    uid: 'praktikan-09',
    nama: 'Hendra Wijaya',
    nim: '24060124130109',
    email: 'praktikan9@hadirin.test',
    peran: 'PRAKTIKAN',
    kodePeserta: 'PRK00009',
  },
  {
    uid: 'praktikan-10',
    nama: 'Intan Nuraini',
    nim: '24060124130110',
    email: 'praktikan10@hadirin.test',
    peran: 'PRAKTIKAN',
    kodePeserta: 'PRK00010',
  },
];