export interface SeedKelas {
  idKelas: string;
  namaPraktikum: string;
  asistenUid: string;
  diarsipkan: boolean;
}

export const DATA_KELAS: SeedKelas[] = [
  {
    idKelas: 'kelas-ppk-a2-26',
    namaPraktikum: 'Pengembangan Platform Khusus A2 - 2026',
    asistenUid: 'asisten-01',
    diarsipkan: false,
  },
  {
    idKelas: 'kelas-ppk-b2-26',
    namaPraktikum: 'Pengembangan Platform Khusus B2 - 2026',
    asistenUid: 'asisten-01',
    diarsipkan: false,
  },
  {
    idKelas: 'kelas-jarkom-c1-26',
    namaPraktikum: 'Jaringan Komputer C1 - 2026',
    asistenUid: 'asisten-02',
    diarsipkan: false,
  },
  {
    idKelas: 'kelas-jarkom-d1-26',
    namaPraktikum: 'Jaringan Komputer D1 - 2026',
    asistenUid: 'asisten-02',
    diarsipkan: false,
  },
  {
    idKelas: 'kelas-ml-c1-26',
    namaPraktikum: 'Machine Learning C1 - 2026',
    asistenUid: 'asisten-03',
    diarsipkan: false,
  },
  {
    idKelas: 'kelas-ml-e1-26',
    namaPraktikum: 'Machine Learning E1 - 2026',
    asistenUid: 'asisten-03',
    diarsipkan: false,
  },
  {
    idKelas: 'kelas-pbo-a1-26',
    namaPraktikum: 'Pemrograman Berorientasi Objek A1 - 2026',
    asistenUid: 'asisten-04',
    diarsipkan: false,
  },
  {
    idKelas: 'kelas-basdat-d2-26',
    namaPraktikum: 'Basis Data D2 - 2026',
    asistenUid: 'asisten-04',
    diarsipkan: false,
  },
  {
    idKelas: 'kelas-strukdat-c2-25',
    namaPraktikum: 'Struktur Data C2 - 2025',
    asistenUid: 'asisten-01',
    diarsipkan: true,
  },
  {
    idKelas: 'kelas-alpro-e2-25',
    namaPraktikum: 'Algoritma Pemrograman E2 - 2025',
    asistenUid: 'asisten-02',
    diarsipkan: true,
  },
];