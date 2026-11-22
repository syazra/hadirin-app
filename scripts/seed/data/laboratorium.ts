export interface SeedLaboratorium {
  idLab: 'lab-b' | 'lab-c' | 'lab-d' | 'lab-ap';
  kodeLab: 'B' | 'C' | 'D' | 'AP';
  nama: string;
  lokasiGedung: string;
  latitude: number;
  longitude: number;
  radiusPresensi: number;
  aktif: boolean;
}

export const DATA_LABORATORIUM: SeedLaboratorium[] = [
  {
    idLab: 'lab-b',
    kodeLab: 'B',
    nama: 'Lab B',
    lokasiGedung: 'Gedung E Lt. 2',
    latitude: -7.0482375,
    longitude: 110.440765625,
    radiusPresensi: 40,
    aktif: true,
  },
  {
    idLab: 'lab-c',
    kodeLab: 'C',
    nama: 'Lab C',
    lokasiGedung: 'Gedung E Lt. 2',
    latitude: -7.0482375,
    longitude: 110.440765625,
    radiusPresensi: 40,
    aktif: true,
  },
  {
    idLab: 'lab-d',
    kodeLab: 'D',
    nama: 'Lab D',
    lokasiGedung: 'Gedung E Lt. 2',
    latitude: -7.0482375,
    longitude: 110.440765625,
    radiusPresensi: 40,
    aktif: true,
  },
  {
    idLab: 'lab-ap',
    kodeLab: 'AP',
    nama: 'Lab AP',
    lokasiGedung: 'Gedung AP Lt. 5',
    latitude: -7.0490375,
    longitude: 110.441484375,
    radiusPresensi: 45,
    aktif: true,
  },
];