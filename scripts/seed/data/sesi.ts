import type { StatusSesi } from '../../../src/types';

export type KodeLabEnum = 'B' | 'C' | 'D' | 'AP';

export interface SeedSesi {
  idSesi: string;
  kelasId: string;
  judul: string;
  labEnum: KodeLabEnum;
  idLab: 'lab-b' | 'lab-c' | 'lab-d' | 'lab-ap';
  lokasi: 'Gedung E Lt. 2' | 'Gedung AP Lt. 5';
  waktuMulai: string;
  waktuSelesai: string;
  statusSesi: StatusSesi;
  diarsipkan: boolean;
  kodeQr: string;
}

export const DATA_SESI: SeedSesi[] = [
  // 1-3: PPK A2 - 2026 (Lab B -> Gedung E Lt. 2)
  {
    idSesi: 'sesi-ppk-a2-26-01',
    kelasId: 'kelas-ppk-a2-26',
    judul: 'Pertemuan 1 - Pengenalan React Native & Expo',
    labEnum: 'B',
    idLab: 'lab-b',
    lokasi: 'Gedung E Lt. 2',
    waktuMulai: '2026-10-05T08:00:00+07:00',
    waktuSelesai: '2026-10-05T10:00:00+07:00',
    statusSesi: 'DITUTUP',
    diarsipkan: false,
    kodeQr: 'a1b2c3d4e5f60718293a4b5c6d7e8f01',
  },
  {
    idSesi: 'sesi-ppk-a2-26-02',
    kelasId: 'kelas-ppk-a2-26',
    judul: 'Pertemuan 2 - Navigasi & State Management',
    labEnum: 'B',
    idLab: 'lab-b',
    lokasi: 'Gedung E Lt. 2',
    waktuMulai: '2026-11-20T11:00:00+07:00',
    waktuSelesai: '2026-11-20T14:00:00+07:00',
    statusSesi: 'DIBUKA',
    diarsipkan: false,
    kodeQr: 'a1b2c3d4e5f60718293a4b5c6d7e8f02',
  },
  {
    idSesi: 'sesi-ppk-a2-26-03',
    kelasId: 'kelas-ppk-a2-26',
    judul: 'Pertemuan 3 - Integrasi Firebase & Geofence',
    labEnum: 'B',
    idLab: 'lab-b',
    lokasi: 'Gedung E Lt. 2',
    waktuMulai: '2026-11-27T08:00:00+07:00',
    waktuSelesai: '2026-11-27T10:00:00+07:00',
    statusSesi: 'BELUM_DIBUKA',
    diarsipkan: false,
    kodeQr: 'a1b2c3d4e5f60718293a4b5c6d7e8f03',
  },

  // 4-5: PPK B2 - 2026 (Lab C -> Gedung E Lt. 2)
  {
    idSesi: 'sesi-ppk-b2-26-01',
    kelasId: 'kelas-ppk-b2-26',
    judul: 'Pertemuan 1 - Dasar Komponen & Layouting',
    labEnum: 'C',
    idLab: 'lab-c',
    lokasi: 'Gedung E Lt. 2',
    waktuMulai: '2026-10-06T10:00:00+07:00',
    waktuSelesai: '2026-10-06T12:00:00+07:00',
    statusSesi: 'DITUTUP',
    diarsipkan: false,
    kodeQr: 'b1b2c3d4e5f60718293a4b5c6d7e8f01',
  },
  {
    idSesi: 'sesi-ppk-b2-26-02',
    kelasId: 'kelas-ppk-b2-26',
    judul: 'Pertemuan 2 - Custom Hooks & Async Storage',
    labEnum: 'C',
    idLab: 'lab-c',
    lokasi: 'Gedung E Lt. 2',
    waktuMulai: '2026-11-20T15:00:00+07:00',
    waktuSelesai: '2026-11-20T17:00:00+07:00',
    statusSesi: 'BELUM_DIBUKA',
    diarsipkan: false,
    kodeQr: 'b1b2c3d4e5f60718293a4b5c6d7e8f02',
  },

  // 6-7: Jarkom C1 - 2026 (Lab D -> Gedung E Lt. 2)
  {
    idSesi: 'sesi-jarkom-c1-26-01',
    kelasId: 'kelas-jarkom-c1-26',
    judul: 'Pertemuan 1 - Konfigurasi Subnetting & VLAN',
    labEnum: 'D',
    idLab: 'lab-d',
    lokasi: 'Gedung E Lt. 2',
    waktuMulai: '2026-10-08T10:00:00+07:00',
    waktuSelesai: '2026-10-08T12:00:00+07:00',
    statusSesi: 'DITUTUP',
    diarsipkan: false,
    kodeQr: 'c1b2c3d4e5f60718293a4b5c6d7e8f01',
  },
  {
    idSesi: 'sesi-jarkom-c1-26-02',
    kelasId: 'kelas-jarkom-c1-26',
    judul: 'Pertemuan 2 - Static & Dynamic Routing',
    labEnum: 'D',
    idLab: 'lab-d',
    lokasi: 'Gedung E Lt. 2',
    waktuMulai: '2026-11-20T11:30:00+07:00',
    waktuSelesai: '2026-11-20T14:00:00+07:00',
    statusSesi: 'DIBUKA',
    diarsipkan: false,
    kodeQr: 'c1b2c3d4e5f60718293a4b5c6d7e8f02',
  },

  // 8: Jarkom D1 - 2026 (Lab D -> Gedung E Lt. 2)
  {
    idSesi: 'sesi-jarkom-d1-26-01',
    kelasId: 'kelas-jarkom-d1-26',
    judul: 'Pertemuan 1 - Analisis Paket Wireshark',
    labEnum: 'D',
    idLab: 'lab-d',
    lokasi: 'Gedung E Lt. 2',
    waktuMulai: '2026-11-21T08:00:00+07:00',
    waktuSelesai: '2026-11-21T10:00:00+07:00',
    statusSesi: 'BELUM_DIBUKA',
    diarsipkan: false,
    kodeQr: 'c2b2c3d4e5f60718293a4b5c6d7e8f01',
  },

  // 9-10: Machine Learning C1 & E1 - 2026 (Lab AP -> Gedung AP Lt. 5)
  {
    idSesi: 'sesi-ml-c1-26-06',
    kelasId: 'kelas-ml-c1-26',
    judul: 'Pertemuan 6 - Evaluasi Model Klasifikasi',
    labEnum: 'AP',
    idLab: 'lab-ap',
    lokasi: 'Gedung AP Lt. 5',
    waktuMulai: '2026-11-20T11:00:00+07:00',
    waktuSelesai: '2026-11-20T14:00:00+07:00',
    statusSesi: 'DIBUKA',
    diarsipkan: false,
    kodeQr: 'd1b2c3d4e5f60718293a4b5c6d7e8f06',
  },
  {
    idSesi: 'sesi-ml-e1-26-01',
    kelasId: 'kelas-ml-e1-26',
    judul: 'Pertemuan 1 - Eksplorasi Dataset & Preprocessing',
    labEnum: 'AP',
    idLab: 'lab-ap',
    lokasi: 'Gedung AP Lt. 5',
    waktuMulai: '2026-11-22T13:00:00+07:00',
    waktuSelesai: '2026-11-22T15:00:00+07:00',
    statusSesi: 'BELUM_DIBUKA',
    diarsipkan: false,
    kodeQr: 'd2b2c3d4e5f60718293a4b5c6d7e8f01',
  },

  // 11: PBO A1 - 2026 (Lab B -> Gedung E Lt. 2)
  {
    idSesi: 'sesi-pbo-a1-26-01',
    kelasId: 'kelas-pbo-a1-26',
    judul: 'Pertemuan 1 - Enkapsulasi & Inheritance Java',
    labEnum: 'B',
    idLab: 'lab-b',
    lokasi: 'Gedung E Lt. 2',
    waktuMulai: '2026-10-09T08:00:00+07:00',
    waktuSelesai: '2026-10-09T10:00:00+07:00',
    statusSesi: 'DITUTUP',
    diarsipkan: false,
    kodeQr: 'f1b2c3d4e5f60718293a4b5c6d7e8f01',
  },

  // 12: Basis Data D2 - 2026 (Lab C -> Gedung E Lt. 2)
  {
    idSesi: 'sesi-basdat-d2-26-01',
    kelasId: 'kelas-basdat-d2-26',
    judul: 'Pertemuan 1 - Perancangan ERD & Normalisasi',
    labEnum: 'C',
    idLab: 'lab-c',
    lokasi: 'Gedung E Lt. 2',
    waktuMulai: '2026-10-10T10:00:00+07:00',
    waktuSelesai: '2026-10-10T12:00:00+07:00',
    statusSesi: 'DITUTUP',
    diarsipkan: false,
    kodeQr: 'f2b2c3d4e5f60718293a4b5c6d7e8f01',
  },
];