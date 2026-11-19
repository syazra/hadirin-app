export interface SeedKeanggotaan {
  idKeanggotaan: string;
  kelasId: string;
  uid: string;
  nama: string;
  nim: string;
  status: 'AKTIF' | 'NONAKTIF';
}

export const DATA_KEANGGOTAAN: SeedKeanggotaan[] = [
  // Kelas PPK-A (3 aktif, 1 nonaktif)
  {
    idKeanggotaan: 'seed-kelas-ppk-a_seed-praktikan-01',
    kelasId: 'seed-kelas-ppk-a',
    uid: 'seed-praktikan-01',
    nama: 'Dimas Aditya (Seed Praktikan 1)',
    nim: '24060124120101',
    status: 'AKTIF',
  },
  {
    idKeanggotaan: 'seed-kelas-ppk-a_seed-praktikan-02',
    kelasId: 'seed-kelas-ppk-a',
    uid: 'seed-praktikan-02',
    nama: 'Salsa Maharani (Seed Praktikan 2)',
    nim: '24060124130102',
    status: 'AKTIF',
  },
  {
    idKeanggotaan: 'seed-kelas-ppk-a_seed-praktikan-03',
    kelasId: 'seed-kelas-ppk-a',
    uid: 'seed-praktikan-03',
    nama: 'Fajar Nugroho (Seed Praktikan 3)',
    nim: '24060124140103',
    status: 'AKTIF',
  },
  {
    idKeanggotaan: 'seed-kelas-ppk-a_seed-praktikan-04',
    kelasId: 'seed-kelas-ppk-a',
    uid: 'seed-praktikan-04',
    nama: 'Alya Ramadhani (Seed Praktikan 4)',
    nim: '24060124120104',
    status: 'NONAKTIF',
  },
  // Kelas PBO-B (2 aktif)
  {
    idKeanggotaan: 'seed-kelas-pbo-b_seed-praktikan-01',
    kelasId: 'seed-kelas-pbo-b',
    uid: 'seed-praktikan-01',
    nama: 'Dimas Aditya (Seed Praktikan 1)',
    nim: '24060124120101',
    status: 'AKTIF',
  },
  {
    idKeanggotaan: 'seed-kelas-pbo-b_seed-praktikan-04',
    kelasId: 'seed-kelas-pbo-b',
    uid: 'seed-praktikan-04',
    nama: 'Alya Ramadhani (Seed Praktikan 4)',
    nim: '24060124120104',
    status: 'AKTIF',
  },
];