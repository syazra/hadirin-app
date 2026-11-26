export interface SeedKelas {
  idKelas: string;
  namaPraktikum: string;
  asistenUid: string;
  gracePeriodMenit: number;
  nominalDenda: number;
  diarsipkan: boolean;
}

export const DATA_KELAS: SeedKelas[] = [
  // Asisten 01 (Shafa Aqilla Zahira) - 10 kelas (9 aktif + 1 arsip)
  {
    idKelas: 'kelas-ppk-d1-26',
    namaPraktikum: 'Pengembangan Platform Khusus D1 - 2026',
    asistenUid: 'asisten-01',
    gracePeriodMenit: 15,
    nominalDenda: 5000,
    diarsipkan: false,
  },
  {
    idKelas: 'kelas-ppk-a2-26',
    namaPraktikum: 'Pengembangan Platform Khusus A2 - 2026',
    asistenUid: 'asisten-01',
    gracePeriodMenit: 15,
    nominalDenda: 5000,
    diarsipkan: false,
  },
  {
    idKelas: 'kelas-ppk-b2-26',
    namaPraktikum: 'Pengembangan Platform Khusus B2 - 2026',
    asistenUid: 'asisten-01',
    gracePeriodMenit: 10,
    nominalDenda: 5000,
    diarsipkan: false,
  },
  {
    idKelas: 'kelas-pbo-a1-26',
    namaPraktikum: 'Pemrograman Berorientasi Objek A1 - 2026',
    asistenUid: 'asisten-01',
    gracePeriodMenit: 15,
    nominalDenda: 10000,
    diarsipkan: false,
  },
  {
    idKelas: 'kelas-basdat-d2-26',
    namaPraktikum: 'Basis Data D2 - 2026',
    asistenUid: 'asisten-01',
    gracePeriodMenit: 10,
    nominalDenda: 5000,
    diarsipkan: false,
  },
  {
    idKelas: 'kelas-ml-c1-26',
    namaPraktikum: 'Machine Learning C1 - 2026',
    asistenUid: 'asisten-01',
    gracePeriodMenit: 15,
    nominalDenda: 5000,
    diarsipkan: false,
  },
  {
    idKelas: 'kelas-so-a2-26',
    namaPraktikum: 'Sistem Operasi A2 - 2026',
    asistenUid: 'asisten-01',
    gracePeriodMenit: 15,
    nominalDenda: 5000,
    diarsipkan: false,
  },
  {
    idKelas: 'kelas-rpl-b1-26',
    namaPraktikum: 'Rekayasa Perangkat Lunak B1 - 2026',
    asistenUid: 'asisten-01',
    gracePeriodMenit: 20,
    nominalDenda: 0,
    diarsipkan: false,
  },
  {
    idKelas: 'kelas-kcv-a1-26',
    namaPraktikum: 'Komputasi Cerdas & Visi A1 - 2026',
    asistenUid: 'asisten-01',
    gracePeriodMenit: 10,
    nominalDenda: 5000,
    diarsipkan: false,
  },
  {
    idKelas: 'kelas-strukdat-c2-25',
    namaPraktikum: 'Struktur Data C2 - 2025',
    asistenUid: 'asisten-01',
    gracePeriodMenit: 15,
    nominalDenda: 5000,
    diarsipkan: true,
  },

  // Asisten 02 (Binar Ridha Wiritanaya) - 2 kelas
  {
    idKelas: 'kelas-jarkom-c1-26',
    namaPraktikum: 'Jaringan Komputer C1 - 2026',
    asistenUid: 'asisten-02',
    gracePeriodMenit: 15,
    nominalDenda: 5000,
    diarsipkan: false,
  },
  {
    idKelas: 'kelas-jarkom-d1-26',
    namaPraktikum: 'Jaringan Komputer D1 - 2026',
    asistenUid: 'asisten-02',
    gracePeriodMenit: 15,
    nominalDenda: 5000,
    diarsipkan: false,
  },
];