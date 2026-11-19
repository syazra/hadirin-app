export interface SeedLaboratorium {
  id: string;
  kode: string;
  nama: string;
  latitude: number;
  longitude: number;
  radiusPresensi: number;
  aktif: boolean;
}

export const DATA_LABORATORIUM: SeedLaboratorium[] = [
  {
    id: 'lab-rpl-01',
    kode: 'LAB-RPL',
    nama: 'Laboratorium Rekayasa Perangkat Lunak (Gedung E Lt. 3)',
    latitude: -7.049312,
    longitude: 110.440891,
    radiusPresensi: 50,
    aktif: true,
  },
  {
    id: 'lab-siscer-02',
    kode: 'LAB-SISCER',
    nama: 'Laboratorium Sistem Cerdas (Gedung E Lt. 3)',
    latitude: -7.049450,
    longitude: 110.441020,
    radiusPresensi: 50,
    aktif: true,
  },
  {
    id: 'lab-lama-nonaktif',
    kode: 'LAB-OLD',
    nama: 'Laboratorium Komputasi Dasar (Renovasi)',
    latitude: -7.049100,
    longitude: 110.440500,
    radiusPresensi: 40,
    aktif: false,
  },
];