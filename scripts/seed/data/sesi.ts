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
  // === ASISTEN 01 (Shafa Aqilla Zahira) - 12 Sesi ===
  // 1-4: PPK D1 - 2026 (Kelas utama berisi 22 praktikan)
  {
    idSesi: 'sesi-ppk-d1-26-01',
    kelasId: 'kelas-ppk-d1-26',
    judul: 'Pertemuan 1 - Pengenalan React Native & Expo',
    labEnum: 'B',
    idLab: 'lab-b',
    lokasi: 'Gedung E Lt. 2',
    waktuMulai: '2026-11-06T08:00:00+07:00',
    waktuSelesai: '2026-11-06T10:00:00+07:00',
    statusSesi: 'DITUTUP',
    diarsipkan: false,
    kodeQr: 'd1a2c3d4e5f60718293a4b5c6d7e8f01',
  },
  {
    idSesi: 'sesi-ppk-d1-26-02',
    kelasId: 'kelas-ppk-d1-26',
    judul: 'Pertemuan 2 - Navigasi & State Management',
    labEnum: 'B',
    idLab: 'lab-b',
    lokasi: 'Gedung E Lt. 2',
    waktuMulai: '2026-11-13T08:00:00+07:00',
    waktuSelesai: '2026-11-13T10:00:00+07:00',
    statusSesi: 'DITUTUP',
    diarsipkan: false,
    kodeQr: 'd1a2c3d4e5f60718293a4b5c6d7e8f02',
  },
  {
    idSesi: 'sesi-ppk-d1-26-03',
    kelasId: 'kelas-ppk-d1-26',
    judul: 'Pertemuan 3 - Integrasi Cloud Firestore & Realtime Listener',
    labEnum: 'B',
    idLab: 'lab-b',
    lokasi: 'Gedung E Lt. 2',
    waktuMulai: '2026-11-27T08:00:00+07:00',
    waktuSelesai: '2026-11-27T11:00:00+07:00',
    statusSesi: 'DIBUKA',
    diarsipkan: false,
    kodeQr: 'd1a2c3d4e5f60718293a4b5c6d7e8f03',
  },
  {
    idSesi: 'sesi-ppk-d1-26-04',
    kelasId: 'kelas-ppk-d1-26',
    judul: 'Pertemuan 4 - Geofencing GPS & Validasi Radius Lab',
    labEnum: 'B',
    idLab: 'lab-b',
    lokasi: 'Gedung E Lt. 2',
    waktuMulai: '2026-12-01T08:00:00+07:00',
    waktuSelesai: '2026-12-01T10:00:00+07:00',
    statusSesi: 'BELUM_DIBUKA',
    diarsipkan: false,
    kodeQr: 'd1a2c3d4e5f60718293a4b5c6d7e8f04',
  },

  // 5-6: PPK A2 - 2026
  {
    idSesi: 'sesi-ppk-a2-26-01',
    kelasId: 'kelas-ppk-a2-26',
    judul: 'Pertemuan 1 - Setup Environment & Komponen Dasar',
    labEnum: 'C',
    idLab: 'lab-c',
    lokasi: 'Gedung E Lt. 2',
    waktuMulai: '2026-11-10T10:00:00+07:00',
    waktuSelesai: '2026-11-10T12:00:00+07:00',
    statusSesi: 'DITUTUP',
    diarsipkan: false,
    kodeQr: 'a2a2c3d4e5f60718293a4b5c6d7e8f01',
  },
  {
    idSesi: 'sesi-ppk-a2-26-02',
    kelasId: 'kelas-ppk-a2-26',
    judul: 'Pertemuan 2 - Push Notification & Background Tasks',
    labEnum: 'C',
    idLab: 'lab-c',
    lokasi: 'Gedung E Lt. 2',
    waktuMulai: '2026-11-29T10:00:00+07:00',
    waktuSelesai: '2026-11-29T12:00:00+07:00',
    statusSesi: 'BELUM_DIBUKA',
    diarsipkan: false,
    kodeQr: 'a2a2c3d4e5f60718293a4b5c6d7e8f02',
  },

  // 7-8: PPK B2 - 2026
  {
    idSesi: 'sesi-ppk-b2-26-01',
    kelasId: 'kelas-ppk-b2-26',
    judul: 'Pertemuan 1 - Custom Hooks & Async Storage',
    labEnum: 'C',
    idLab: 'lab-c',
    lokasi: 'Gedung E Lt. 2',
    waktuMulai: '2026-11-12T13:00:00+07:00',
    waktuSelesai: '2026-11-12T15:00:00+07:00',
    statusSesi: 'DITUTUP',
    diarsipkan: false,
    kodeQr: 'b2a2c3d4e5f60718293a4b5c6d7e8f01',
  },
  {
    idSesi: 'sesi-ppk-b2-26-02',
    kelasId: 'kelas-ppk-b2-26',
    judul: 'Pertemuan 2 - Optimasi Performa & Memoization',
    labEnum: 'C',
    idLab: 'lab-c',
    lokasi: 'Gedung E Lt. 2',
    waktuMulai: '2026-11-30T13:00:00+07:00',
    waktuSelesai: '2026-11-30T15:00:00+07:00',
    statusSesi: 'BELUM_DIBUKA',
    diarsipkan: false,
    kodeQr: 'b2a2c3d4e5f60718293a4b5c6d7e8f02',
  },

  // 9: PBO A1 - 2026
  {
    idSesi: 'sesi-pbo-a1-26-01',
    kelasId: 'kelas-pbo-a1-26',
    judul: 'Pertemuan 1 - Enkapsulasi & Inheritance Java',
    labEnum: 'D',
    idLab: 'lab-d',
    lokasi: 'Gedung E Lt. 2',
    waktuMulai: '2026-11-14T08:00:00+07:00',
    waktuSelesai: '2026-11-14T10:00:00+07:00',
    statusSesi: 'DITUTUP',
    diarsipkan: false,
    kodeQr: 'pbo1c3d4e5f60718293a4b5c6d7e8f01',
  },

  // 10: Basis Data D2 - 2026
  {
    idSesi: 'sesi-basdat-d2-26-01',
    kelasId: 'kelas-basdat-d2-26',
    judul: 'Pertemuan 1 - Perancangan ERD & Normalisasi',
    labEnum: 'D',
    idLab: 'lab-d',
    lokasi: 'Gedung E Lt. 2',
    waktuMulai: '2026-11-17T10:00:00+07:00',
    waktuSelesai: '2026-11-17T12:00:00+07:00',
    statusSesi: 'DITUTUP',
    diarsipkan: false,
    kodeQr: 'bsd1c3d4e5f60718293a4b5c6d7e8f01',
  },

  // 11: Machine Learning C1 - 2026
  {
    idSesi: 'sesi-ml-c1-26-01',
    kelasId: 'kelas-ml-c1-26',
    judul: 'Pertemuan 1 - Eksplorasi Dataset & Preprocessing',
    labEnum: 'AP',
    idLab: 'lab-ap',
    lokasi: 'Gedung AP Lt. 5',
    waktuMulai: '2026-12-02T13:00:00+07:00',
    waktuSelesai: '2026-12-02T15:00:00+07:00',
    statusSesi: 'BELUM_DIBUKA',
    diarsipkan: false,
    kodeQr: 'mlc1c3d4e5f60718293a4b5c6d7e8f01',
  },

  // 12: Sistem Operasi A2 - 2026
  {
    idSesi: 'sesi-so-a2-26-01',
    kelasId: 'kelas-so-a2-26',
    judul: 'Pertemuan 1 - Manajemen Proses & Thread Linux',
    labEnum: 'AP',
    idLab: 'lab-ap',
    lokasi: 'Gedung AP Lt. 5',
    waktuMulai: '2026-12-03T09:00:00+07:00',
    waktuSelesai: '2026-12-03T11:00:00+07:00',
    statusSesi: 'BELUM_DIBUKA',
    diarsipkan: false,
    kodeQr: 'soa2c3d4e5f60718293a4b5c6d7e8f01',
  },

  // === ASISTEN 02 (Binar Ridha Wiritanaya) - 2 Sesi ===
  {
    idSesi: 'sesi-jarkom-c1-26-01',
    kelasId: 'kelas-jarkom-c1-26',
    judul: 'Pertemuan 1 - Konfigurasi Subnetting & VLAN',
    labEnum: 'D',
    idLab: 'lab-d',
    lokasi: 'Gedung E Lt. 2',
    waktuMulai: '2026-11-18T10:00:00+07:00',
    waktuSelesai: '2026-11-18T12:00:00+07:00',
    statusSesi: 'DITUTUP',
    diarsipkan: false,
    kodeQr: 'jrk1c3d4e5f60718293a4b5c6d7e8f01',
  },
  {
    idSesi: 'sesi-jarkom-d1-26-01',
    kelasId: 'kelas-jarkom-d1-26',
    judul: 'Pertemuan 1 - Analisis Paket Wireshark',
    labEnum: 'D',
    idLab: 'lab-d',
    lokasi: 'Gedung E Lt. 2',
    waktuMulai: '2026-12-02T08:00:00+07:00',
    waktuSelesai: '2026-12-02T10:00:00+07:00',
    statusSesi: 'BELUM_DIBUKA',
    diarsipkan: false,
    kodeQr: 'jrk2c3d4e5f60718293a4b5c6d7e8f01',
  },
];