export interface SeedPengguna {
  uid: string;
  nama: string;
  nim: string;
  email: string;
  peran: 'ASISTEN' | 'PRAKTIKAN';
  kodePeserta: string;
}

export const DATA_PENGGUNA: SeedPengguna[] = [
  {
    uid: 'seed-asisten-01',
    nama: 'Raka Pratama (Seed Asisten 1)',
    nim: '24060122130001',
    email: 'asisten1.seed@hadirin.test',
    peran: 'ASISTEN',
    kodePeserta: 'AST00001',
  },
  {
    uid: 'seed-asisten-02',
    nama: 'Nadia Putri (Seed Asisten 2)',
    nim: '24060122140002',
    email: 'asisten2.seed@hadirin.test',
    peran: 'ASISTEN',
    kodePeserta: 'AST00002',
  },
  {
    uid: 'seed-praktikan-01',
    nama: 'Dimas Aditya (Seed Praktikan 1)',
    nim: '24060124120101',
    email: 'praktikan1.seed@hadirin.test',
    peran: 'PRAKTIKAN',
    kodePeserta: 'PRK00101',
  },
  {
    uid: 'seed-praktikan-02',
    nama: 'Salsa Maharani (Seed Praktikan 2)',
    nim: '24060124130102',
    email: 'praktikan2.seed@hadirin.test',
    peran: 'PRAKTIKAN',
    kodePeserta: 'PRK00102',
  },
  {
    uid: 'seed-praktikan-03',
    nama: 'Fajar Nugroho (Seed Praktikan 3)',
    nim: '24060124140103',
    email: 'praktikan3.seed@hadirin.test',
    peran: 'PRAKTIKAN',
    kodePeserta: 'PRK00103',
  },
  {
    uid: 'seed-praktikan-04',
    nama: 'Alya Ramadhani (Seed Praktikan 4)',
    nim: '24060124120104',
    email: 'praktikan4.seed@hadirin.test',
    peran: 'PRAKTIKAN',
    kodePeserta: 'PRK00104',
  },
];