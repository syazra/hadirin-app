import type { KategoriIzin, StatusAi, StatusIzin } from '../../../src/types';

export interface SeedIzin {
  idIzin: string;
  sesiId: string;
  kelasId: string;
  uid: string;
  alasan: string;
  statusIzin: StatusIzin;
  diperiksaOleh: string | null;
  waktuPeriksa: string | null;
  kategoriAi: KategoriIzin | null;
  statusAi: StatusAi;
  modelAi: string | null;
  waktuAi: string | null;
  dibuatPada: string;
}

export const DATA_IZIN: SeedIzin[] = [
  // 1. KESEHATAN -> StatusRekap: SAKIT
  {
    idIzin: 'seed-izin-ppb01-p03',
    sesiId: 'seed-sesi-ppb-01',
    kelasId: 'seed-kelas-ppb-a',
    uid: 'seed-praktikan-03',
    alasan: 'Demam tinggi dan sedang berobat ke klinik kampus dengan surat dokter.',
    statusIzin: 'DISETUJUI',
    diperiksaOleh: 'seed-asisten-01',
    waktuPeriksa: '2026-10-05T07:45:00+07:00',
    kategoriAi: 'KESEHATAN',
    statusAi: 'SUKSES',
    modelAi: 'gemini-2.5-flash',
    waktuAi: '2026-10-05T07:31:00+07:00',
    dibuatPada: '2026-10-05T07:30:00+07:00',
  },
  // 2. AKADEMIK -> StatusRekap: IZIN
  {
    idIzin: 'seed-izin-ppb01-p04',
    sesiId: 'seed-sesi-ppb-01',
    kelasId: 'seed-kelas-ppb-a',
    uid: 'seed-praktikan-04',
    alasan: 'Menjadi delegasi lomba GEMASTIK mewakili fakultas di luar kota.',
    statusIzin: 'DISETUJUI',
    diperiksaOleh: 'seed-asisten-01',
    waktuPeriksa: '2026-10-05T07:50:00+07:00',
    kategoriAi: 'AKADEMIK',
    statusAi: 'SUKSES',
    modelAi: 'gemini-2.5-flash',
    waktuAi: '2026-10-05T07:36:00+07:00',
    dibuatPada: '2026-10-05T07:35:00+07:00',
  },
  // 3. AI GAGAL -> Fallback StatusRekap: IZIN + aiBelumTersedia: true
  {
    idIzin: 'seed-izin-ppb01-p06',
    sesiId: 'seed-sesi-ppb-01',
    kelasId: 'seed-kelas-ppb-a',
    uid: 'seed-praktikan-06',
    alasan: 'Menghadiri acara pernikahan kakak kandung di Semarang.',
    statusIzin: 'DISETUJUI',
    diperiksaOleh: 'seed-asisten-01',
    waktuPeriksa: '2026-10-05T07:52:00+07:00',
    kategoriAi: null,
    statusAi: 'GAGAL',
    modelAi: null,
    waktuAi: null,
    dibuatPada: '2026-10-05T07:40:00+07:00',
  },
  // 4. DITOLAK pada sesi DITUTUP -> StatusRekap: ALPHA
  {
    idIzin: 'seed-izin-ppb01-p07',
    sesiId: 'seed-sesi-ppb-01',
    kelasId: 'seed-kelas-ppb-a',
    uid: 'seed-praktikan-07',
    alasan: 'Bangun kesiangan karena alarm tidak berbunyi.',
    statusIzin: 'DITOLAK',
    diperiksaOleh: 'seed-asisten-01',
    waktuPeriksa: '2026-10-05T08:15:00+07:00',
    kategoriAi: 'LAINNYA',
    statusAi: 'SUKSES',
    modelAi: 'gemini-2.5-flash',
    waktuAi: '2026-10-05T08:10:00+07:00',
    dibuatPada: '2026-10-05T08:09:00+07:00',
  },
  // 5. KESEHATAN -> StatusRekap: SAKIT
  {
    idIzin: 'seed-izin-ppb02-p02',
    sesiId: 'seed-sesi-ppb-02',
    kelasId: 'seed-kelas-ppb-a',
    uid: 'seed-praktikan-02',
    alasan: 'Sakit gigi dan harus menjalani tindakan cabut gigi di RSND.',
    statusIzin: 'DISETUJUI',
    diperiksaOleh: 'seed-asisten-01',
    waktuPeriksa: '2026-10-12T07:40:00+07:00',
    kategoriAi: 'KESEHATAN',
    statusAi: 'SUKSES',
    modelAi: 'gemini-2.5-flash',
    waktuAi: '2026-10-12T07:25:00+07:00',
    dibuatPada: '2026-10-12T07:24:00+07:00',
  },
  // 6. KELUARGA tapi juga punya presensi QR -> StatusRekap: HADIR
  {
    idIzin: 'seed-izin-ppb03-p02',
    sesiId: 'seed-sesi-ppb-03',
    kelasId: 'seed-kelas-ppb-a',
    uid: 'seed-praktikan-02',
    alasan: 'Awalnya mengira terlambat karena hujan deras, tetapi akhirnya sempat hadir.',
    statusIzin: 'DISETUJUI',
    diperiksaOleh: 'seed-asisten-01',
    waktuPeriksa: '2026-11-19T07:55:00+07:00',
    kategoriAi: 'KELUARGA',
    statusAi: 'SUKSES',
    modelAi: 'gemini-2.5-flash',
    waktuAi: '2026-11-19T07:51:00+07:00',
    dibuatPada: '2026-11-19T07:50:00+07:00',
  },
  // 7. KESEHATAN -> StatusRekap: SAKIT
  {
    idIzin: 'seed-izin-ppb03-p03',
    sesiId: 'seed-sesi-ppb-03',
    kelasId: 'seed-kelas-ppb-a',
    uid: 'seed-praktikan-03',
    alasan: 'Tipus ringan dan diminta istirahat total oleh dokter puskesmas.',
    statusIzin: 'DISETUJUI',
    diperiksaOleh: 'seed-asisten-01',
    waktuPeriksa: '2026-11-19T07:58:00+07:00',
    kategoriAi: 'KESEHATAN',
    statusAi: 'SUKSES',
    modelAi: 'gemini-2.5-flash',
    waktuAi: '2026-11-19T07:42:00+07:00',
    dibuatPada: '2026-11-19T07:41:00+07:00',
  },
  // 8. MENUNGGU -> StatusRekap: BELUM_HADIR
  {
    idIzin: 'seed-izin-ppb03-p04',
    sesiId: 'seed-sesi-ppb-03',
    kelasId: 'seed-kelas-ppb-a',
    uid: 'seed-praktikan-04',
    alasan: 'Mengurus berkas beasiswa di rektorat pada jam praktikum.',
    statusIzin: 'MENUNGGU',
    diperiksaOleh: null,
    waktuPeriksa: null,
    kategoriAi: 'AKADEMIK',
    statusAi: 'SUKSES',
    modelAi: 'gemini-2.5-flash',
    waktuAi: '2026-11-19T08:01:00+07:00',
    dibuatPada: '2026-11-19T08:00:00+07:00',
  },
  // 9. statusAi BELUM -> Fallback StatusRekap: IZIN + aiBelumTersedia: true
  {
    idIzin: 'seed-izin-ml01-p05',
    sesiId: 'seed-sesi-ml-01',
    kelasId: 'seed-kelas-ml-a',
    uid: 'seed-praktikan-05',
    alasan: 'Mengantar orang tua kontrol rutin ke rumah sakit.',
    statusIzin: 'DISETUJUI',
    diperiksaOleh: 'seed-asisten-01',
    waktuPeriksa: '2026-10-07T12:50:00+07:00',
    kategoriAi: null,
    statusAi: 'BELUM',
    modelAi: null,
    waktuAi: null,
    dibuatPada: '2026-10-07T12:40:00+07:00',
  },
  // 10. MENUNGGU -> StatusRekap: BELUM_HADIR
  {
    idIzin: 'seed-izin-ml02-p06',
    sesiId: 'seed-sesi-ml-02',
    kelasId: 'seed-kelas-ml-a',
    uid: 'seed-praktikan-06',
    alasan: 'Mengikuti seminar nasional HMIF sebagai panitia inti.',
    statusIzin: 'MENUNGGU',
    diperiksaOleh: null,
    waktuPeriksa: null,
    kategoriAi: null,
    statusAi: 'BELUM',
    modelAi: null,
    waktuAi: null,
    dibuatPada: '2026-11-19T12:45:00+07:00',
  },
];