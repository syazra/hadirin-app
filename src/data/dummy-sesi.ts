import type { Sesi } from '@/types';

// Sesi A/B/C dipetakan ke S001/S002/S003; ID, jadwal, dan kode QR tetap.
export const dummySesi: Sesi[] = [
  {
    idSesi: 'S001',
    namaPraktikum: 'Praktikum Basis Data',
    kelasLab: 'Lab Informatika 1',
    waktu: 'Senin, 08.00–10.00 WIB',
    statusSesi: 'DITUTUP',
    kodeQr: 'basis-data-s001',
  },
  {
    idSesi: 'S002',
    namaPraktikum: 'Praktikum Struktur Data',
    kelasLab: 'Lab Informatika 2',
    waktu: 'Selasa, 10.00–12.00 WIB',
    statusSesi: 'DIBUKA',
    kodeQr: 'struktur-data-s002',
  },
  {
    idSesi: 'S003',
    namaPraktikum: 'Praktikum Pemrograman',
    kelasLab: 'Lab Informatika 1',
    waktu: 'Rabu, 13.00–15.00 WIB',
    statusSesi: 'BELUM_DIBUKA',
    kodeQr: 'pemrograman-s003',
  },
];
