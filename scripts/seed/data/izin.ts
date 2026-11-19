export interface SeedIzin {
  idIzin: string;
  sesiId: string;
  kelasId: string;
  uid: string;
  alasan: string;
  statusIzin: 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK';
  diperiksaOleh: string | null;
  kategoriAi: 'SAKIT' | 'IZIN' | null;
  statusAi: 'BELUM' | 'SUKSES' | 'GAGAL';
  modelAi: string | null;
}

export const DATA_IZIN: SeedIzin[] = [
  // Sesi 1 (DITUTUP): Praktikan 2 izin DISETUJUI kategori SAKIT -> Rekap: SAKIT
  {
    idIzin: 'seed-sesi-ppk-01-ditutup_seed-praktikan-02',
    sesiId: 'seed-sesi-ppk-01-ditutup',
    kelasId: 'seed-kelas-ppk-a',
    uid: 'seed-praktikan-02',
    alasan: 'Demam tinggi sejak semalam, melampirkan surat dokter klinik.',
    statusIzin: 'DISETUJUI',
    diperiksaOleh: 'seed-asisten-01',
    kategoriAi: 'SAKIT',
    statusAi: 'SUKSES',
    modelAi: 'gemini-2.5-flash',
  },
  // Sesi 1 (DITUTUP): Praktikan 3 izin DITOLAK tanpa presensi -> Rekap: ALPHA
  {
    idIzin: 'seed-sesi-ppk-01-ditutup_seed-praktikan-03',
    sesiId: 'seed-sesi-ppk-01-ditutup',
    kelasId: 'seed-kelas-ppk-a',
    uid: 'seed-praktikan-03',
    alasan: 'Ketiduran karena begadang.',
    statusIzin: 'DITOLAK',
    diperiksaOleh: 'seed-asisten-01',
    kategoriAi: 'IZIN',
    statusAi: 'SUKSES',
    modelAi: 'gemini-2.5-flash',
  },
  // Sesi 2 (DIBUKA): Praktikan 2 izin DISETUJUI tapi AI GAGAL -> Rekap fallback aman: IZIN
  {
    idIzin: 'seed-sesi-ppk-02-dibuka_seed-praktikan-02',
    sesiId: 'seed-sesi-ppk-02-dibuka',
    kelasId: 'seed-kelas-ppk-a',
    uid: 'seed-praktikan-02',
    alasan: 'Menghadiri acara wisuda kakak kandung di luar kota.',
    statusIzin: 'DISETUJUI',
    diperiksaOleh: 'seed-asisten-01',
    kategoriAi: null,
    statusAi: 'GAGAL',
    modelAi: null,
  },
  // Sesi 2 (DIBUKA): Praktikan 3 izin masih MENUNGGU -> Rekap: BELUM_HADIR
  {
    idIzin: 'seed-sesi-ppk-02-dibuka_seed-praktikan-03',
    sesiId: 'seed-sesi-ppk-02-dibuka',
    kelasId: 'seed-kelas-ppk-a',
    uid: 'seed-praktikan-03',
    alasan: 'Menjadi delegasi lomba hackathon tingkat nasional.',
    statusIzin: 'MENUNGGU',
    diperiksaOleh: null,
    kategoriAi: 'IZIN',
    statusAi: 'SUKSES',
    modelAi: 'gemini-2.5-flash',
  },
];