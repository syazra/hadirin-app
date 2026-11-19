export interface SeedPresensi {
  idPresensi: string;
  sesiId: string;
  kelasId: string;
  uid: string;
}

export const DATA_PRESENSI: SeedPresensi[] = [
  // Pada sesi 1 (DITUTUP): Praktikan 1 HADIR
  {
    idPresensi: 'seed-sesi-ppk-01-ditutup_seed-praktikan-01',
    sesiId: 'seed-sesi-ppk-01-ditutup',
    kelasId: 'seed-kelas-ppk-a',
    uid: 'seed-praktikan-01',
  },
  // Pada sesi 2 (DIBUKA): Praktikan 1 sudah scan QR -> HADIR
  {
    idPresensi: 'seed-sesi-ppk-02-dibuka_seed-praktikan-01',
    sesiId: 'seed-sesi-ppk-02-dibuka',
    kelasId: 'seed-kelas-ppk-a',
    uid: 'seed-praktikan-01',
  },
];