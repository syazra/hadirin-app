import type { Presensi } from '@/types';

// Sesi A (S001) berlangsung Senin, 08.00–10.00 WIB.
// Presensi awal lebih lama dari demo; presensi berikutnya memakai jam perangkat.
export const dummyPresensi: Presensi[] = [
  {
    idPresensi: 'presensi:S001:P001',
    idSesi: 'S001',
    idPengguna: 'P001',
    waktuHadir: '2026-10-19T02:15:00.000Z',
  },
];
