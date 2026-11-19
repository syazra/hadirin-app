export interface SeedKelas {
  idKelas: string;
  namaPraktikum: string;
  asistenUid: string;
  diarsipkan: boolean;
}

export const DATA_KELAS: SeedKelas[] = [
  {
    idKelas: 'seed-kelas-ppk-a',
    namaPraktikum: 'Pengembangan Perangkat Lunak - Kelas A',
    asistenUid: 'seed-asisten-01',
    diarsipkan: false,
  },
  {
    idKelas: 'seed-kelas-pbo-b',
    namaPraktikum: 'Pemrograman Berorientasi Objek - Kelas B',
    asistenUid: 'seed-asisten-02',
    diarsipkan: false,
  },
];