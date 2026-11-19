export interface SeedKelas {
  idKelas: string;
  namaPraktikum: string;
  asistenUid: string;
  diarsipkan: boolean;
}

export const DATA_KELAS: SeedKelas[] = [
  {
    idKelas: 'seed-kelas-ppb-a',
    namaPraktikum: 'Pengembangan Perangkat Bergerak A',
    asistenUid: 'seed-asisten-01',
    diarsipkan: false,
  },
  {
    idKelas: 'seed-kelas-ppb-b',
    namaPraktikum: 'Pengembangan Perangkat Bergerak B',
    asistenUid: 'seed-asisten-01',
    diarsipkan: false,
  },
  {
    idKelas: 'seed-kelas-ml-a',
    namaPraktikum: 'Pembelajaran Mesin A',
    asistenUid: 'seed-asisten-01',
    diarsipkan: false,
  },
  {
    idKelas: 'seed-kelas-jarkom-c',
    namaPraktikum: 'Jaringan Komputer C',
    asistenUid: 'seed-asisten-02',
    diarsipkan: false,
  },
  {
    idKelas: 'seed-kelas-mbd-a',
    namaPraktikum: 'Manajemen Basis Data A',
    asistenUid: 'seed-asisten-02',
    diarsipkan: false,
  },
  {
    idKelas: 'seed-kelas-rpl-b',
    namaPraktikum: 'Rekayasa Perangkat Lunak B',
    asistenUid: 'seed-asisten-03',
    diarsipkan: false,
  },
  {
    idKelas: 'seed-kelas-gkv-a',
    namaPraktikum: 'Grafika dan Komputasi Visual A',
    asistenUid: 'seed-asisten-03',
    diarsipkan: false,
  },
  {
    idKelas: 'seed-kelas-kompar-d',
    namaPraktikum: 'Komputasi Paralel D',
    asistenUid: 'seed-asisten-04',
    diarsipkan: false,
  },
  {
    idKelas: 'seed-kelas-kij-a',
    namaPraktikum: 'Keamanan Informasi dan Jaringan A',
    asistenUid: 'seed-asisten-04',
    diarsipkan: false,
  },
  {
    idKelas: 'seed-kelas-strukdat-arsip',
    namaPraktikum: 'Struktur Data D (Arsip)',
    asistenUid: 'seed-asisten-01',
    diarsipkan: true,
  },
];