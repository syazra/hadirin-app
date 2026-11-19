import type { StatusSesi } from '../../../src/types';

export interface SeedSesi {
  idSesi: string;
  kelasId: string;
  judul: string;
  labId: string;
  lokasi: string;
  waktuMulaiOffsetJam: number;
  durasiJam: number;
  statusSesi: StatusSesi;
  diarsipkan: boolean;
}

export const DATA_SESI: SeedSesi[] = [
  {
    idSesi: 'seed-sesi-ppb-01',
    kelasId: 'seed-kelas-ppb-a',
    judul: 'Pertemuan 1 - Pengenalan React Native & Expo',
    labId: 'seed-lab-rpl',
    lokasi: 'Lab RPL (E-301)',
    waktuMulaiOffsetJam: -168,
    durasiJam: 2,
    statusSesi: 'DITUTUP',
    diarsipkan: false,
  },
  {
    idSesi: 'seed-sesi-ppb-02',
    kelasId: 'seed-kelas-ppb-a',
    judul: 'Pertemuan 2 - Navigasi Expo Router & State',
    labId: 'seed-lab-rpl',
    lokasi: 'Lab RPL (E-301)',
    waktuMulaiOffsetJam: -72,
    durasiJam: 2,
    statusSesi: 'DITUTUP',
    diarsipkan: false,
  },
  {
    idSesi: 'seed-sesi-ppb-03',
    kelasId: 'seed-kelas-ppb-a',
    judul: 'Pertemuan 3 - Integrasi Firebase & Firestore',
    labId: 'seed-lab-rpl',
    lokasi: 'Lab RPL (E-301)',
    waktuMulaiOffsetJam: -1,
    durasiJam: 3,
    statusSesi: 'DIBUKA',
    diarsipkan: false,
  },
  {
    idSesi: 'seed-sesi-ppb-04',
    kelasId: 'seed-kelas-ppb-a',
    judul: 'Pertemuan 4 - Kamera, QR Scanner & Geolocation',
    labId: 'seed-lab-rpl',
    lokasi: 'Lab RPL (E-301)',
    waktuMulaiOffsetJam: 48,
    durasiJam: 2,
    statusSesi: 'BELUM_DIBUKA',
    diarsipkan: false,
  },
  {
    idSesi: 'seed-sesi-ml-01',
    kelasId: 'seed-kelas-ml-a',
    judul: 'Pertemuan 1 - Eksplorasi Dataset & Preprocessing',
    labId: 'seed-lab-siscer',
    lokasi: 'Lab Sistem Cerdas (E-302)',
    waktuMulaiOffsetJam: -120,
    durasiJam: 2,
    statusSesi: 'DITUTUP',
    diarsipkan: false,
  },
  {
    idSesi: 'seed-sesi-ml-02',
    kelasId: 'seed-kelas-ml-a',
    judul: 'Pertemuan 2 - Klasifikasi Supervised Learning',
    labId: 'seed-lab-siscer',
    lokasi: 'Lab Sistem Cerdas (E-302)',
    waktuMulaiOffsetJam: -1,
    durasiJam: 3,
    statusSesi: 'DIBUKA',
    diarsipkan: false,
  },
  {
    idSesi: 'seed-sesi-jarkom-01',
    kelasId: 'seed-kelas-jarkom-c',
    judul: 'Pertemuan 1 - Subnetting & Routing Statis',
    labId: 'seed-lab-jarkom',
    lokasi: 'Lab Jarkom (E-201)',
    waktuMulaiOffsetJam: -96,
    durasiJam: 2,
    statusSesi: 'DITUTUP',
    diarsipkan: false,
  },
  {
    idSesi: 'seed-sesi-jarkom-02',
    kelasId: 'seed-kelas-jarkom-c',
    judul: 'Pertemuan 2 - VLAN & Trunking Switch',
    labId: 'seed-lab-jarkom',
    lokasi: 'Lab Jarkom (E-201)',
    waktuMulaiOffsetJam: 72,
    durasiJam: 2,
    statusSesi: 'BELUM_DIBUKA',
    diarsipkan: false,
  },
  {
    idSesi: 'seed-sesi-rpl-01',
    kelasId: 'seed-kelas-rpl-b',
    judul: 'Pertemuan 1 - Analisis Kebutuhan & Use Case',
    labId: 'seed-lab-rpl',
    lokasi: 'Lab RPL (E-301)',
    waktuMulaiOffsetJam: 0,
    durasiJam: 2,
    statusSesi: 'DIBUKA',
    diarsipkan: false,
  },
  {
    idSesi: 'seed-sesi-sd-arsip-01',
    kelasId: 'seed-kelas-strukdat-arsip',
    judul: 'Pertemuan 1 - Linked List & Stack (Arsip)',
    labId: 'seed-lab-daspro',
    lokasi: 'Lab Daspro 1 (E-101)',
    waktuMulaiOffsetJam: -720,
    durasiJam: 2,
    statusSesi: 'DITUTUP',
    diarsipkan: true,
  },
];