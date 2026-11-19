export interface SeedSesi {
  idSesi: string;
  kelasId: string;
  judul: string;
  labId: string;
  lokasi: string; // Fallback kompatibilitas selama transisi Sprint 2 -> Sprint 3
  waktuMulaiOffsetJam: number; // Relatif terhadap waktu seeder dijalankan
  durasiJam: number;
  statusSesi: 'BELUM_DIBUKA' | 'DIBUKA' | 'DITUTUP';
  diarsipkan: boolean;
}

export const DATA_SESI: SeedSesi[] = [
  {
    idSesi: 'seed-sesi-ppk-01-ditutup',
    kelasId: 'seed-kelas-ppk-a',
    judul: 'Modul 1: Git Workflow & Setup Environment',
    labId: 'lab-rpl-01',
    lokasi: 'Laboratorium Rekayasa Perangkat Lunak (Gedung E Lt. 3)',
    waktuMulaiOffsetJam: -48,
    durasiJam: 2,
    statusSesi: 'DITUTUP',
    diarsipkan: false,
  },
  {
    idSesi: 'seed-sesi-ppk-02-dibuka',
    kelasId: 'seed-kelas-ppk-a',
    judul: 'Modul 2: Integrasi Firestore & Validasi Lokasi',
    labId: 'lab-rpl-01',
    lokasi: 'Laboratorium Rekayasa Perangkat Lunak (Gedung E Lt. 3)',
    waktuMulaiOffsetJam: 0,
    durasiJam: 2,
    statusSesi: 'DIBUKA',
    diarsipkan: false,
  },
  {
    idSesi: 'seed-sesi-ppk-03-belum',
    kelasId: 'seed-kelas-ppk-a',
    judul: 'Modul 3: Push Notification & Deployment',
    labId: 'lab-siscer-02',
    lokasi: 'Laboratorium Sistem Cerdas (Gedung E Lt. 3)',
    waktuMulaiOffsetJam: 24,
    durasiJam: 2,
    statusSesi: 'BELUM_DIBUKA',
    diarsipkan: false,
  },
  {
    idSesi: 'seed-sesi-pbo-01-dibuka',
    kelasId: 'seed-kelas-pbo-b',
    judul: 'Modul 1: Enkapsulasi & Inheritance',
    labId: 'lab-siscer-02',
    lokasi: 'Laboratorium Sistem Cerdas (Gedung E Lt. 3)',
    waktuMulaiOffsetJam: 0,
    durasiJam: 2,
    statusSesi: 'DIBUKA',
    diarsipkan: false,
  },
];