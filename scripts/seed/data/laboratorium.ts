export interface SeedLaboratorium {
  id: string;
  kode: string;
  nama: string;
  latitude: number;
  longitude: number;
  radiusPresensi: number;
  aktif: boolean;
}

export const DATA_LABORATORIUM: SeedLaboratorium[] = [
  {
    id: 'seed-lab-rpl',
    kode: 'E-301',
    nama: 'Laboratorium Rekayasa Perangkat Lunak',
    latitude: -7.051945,
    longitude: 110.440125,
    radiusPresensi: 50,
    aktif: true,
  },
  {
    id: 'seed-lab-siscer',
    kode: 'E-302',
    nama: 'Laboratorium Sistem Cerdas',
    latitude: -7.05201,
    longitude: 110.44024,
    radiusPresensi: 50,
    aktif: true,
  },
  {
    id: 'seed-lab-jarkom',
    kode: 'E-201',
    nama: 'Laboratorium Jaringan Komputer & Keamanan',
    latitude: -7.05188,
    longitude: 110.44005,
    radiusPresensi: 50,
    aktif: true,
  },
  {
    id: 'seed-lab-komvis',
    kode: 'E-202',
    nama: 'Laboratorium Komputasi Visual & Grafika',
    latitude: -7.05191,
    longitude: 110.44019,
    radiusPresensi: 50,
    aktif: true,
  },
  {
    id: 'seed-lab-basdat',
    kode: 'E-203',
    nama: 'Laboratorium Basis Data & Sistem Informasi',
    latitude: -7.05196,
    longitude: 110.44031,
    radiusPresensi: 50,
    aktif: true,
  },
  {
    id: 'seed-lab-daspro',
    kode: 'E-101',
    nama: 'Laboratorium Dasar Pemrograman 1',
    latitude: -7.05182,
    longitude: 110.43998,
    radiusPresensi: 50,
    aktif: true,
  },
  {
    id: 'seed-lab-daspro2',
    kode: 'E-102',
    nama: 'Laboratorium Dasar Pemrograman 2',
    latitude: -7.05185,
    longitude: 110.44009,
    radiusPresensi: 50,
    aktif: true,
  },
  {
    id: 'seed-lab-iot',
    kode: 'F-104',
    nama: 'Laboratorium Embedded System & IoT',
    latitude: -7.05215,
    longitude: 110.44042,
    radiusPresensi: 60,
    aktif: true,
  },
  {
    id: 'seed-lab-hpc',
    kode: 'F-205',
    nama: 'Laboratorium Komputasi Paralel & HPC',
    latitude: -7.05222,
    longitude: 110.44051,
    radiusPresensi: 60,
    aktif: true,
  },
  {
    id: 'seed-lab-arsip',
    kode: 'D-105',
    nama: 'Laboratorium Multimedia Lama (Nonaktif)',
    latitude: -7.0516,
    longitude: 110.4397,
    radiusPresensi: 40,
    aktif: false,
  },
];