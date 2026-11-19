import { Izin, Presensi, StatusRekap, StatusSesi } from '../types';

export interface InputStatusRekap {
  presensi?: Presensi | null;
  izin?: Izin | null;
  statusSesi: StatusSesi;
}

export interface HasilStatusRekap {
  status: StatusRekap;
  /** True jika izin disetujui tetapi AI gagal/belum menghasilkan klasifikasi valid */
  aiBelumTersedia: boolean;
}

export function tentukanStatusRekap({
  presensi,
  izin,
  statusSesi,
}: InputStatusRekap): HasilStatusRekap {
  // 1. Prioritas tertinggi: dokumen presensi berhasil ada -> HADIR
  if (presensi) {
    return {
      status: 'HADIR',
      aiBelumTersedia: false,
    };
  }

  // 2. Prioritas kedua: izin DISETUJUI oleh Asisten
  if (izin && izin.statusIzin === 'DISETUJUI') {
    const kategori = String(izin.kategoriAi ?? '').toUpperCase();

    // Mendukung kontrak final SAKIT (FAR-S2-01) maupun transisi KESEHATAN
    if (kategori === 'SAKIT' || kategori === 'KESEHATAN') {
      return {
        status: 'SAKIT',
        aiBelumTersedia: false,
      };
    }

    // Kategori IZIN valid (termasuk transisi KELUARGA/AKADEMIK)
    if (
      izin.statusAi === 'SUKSES' &&
      (kategori === 'IZIN' || kategori === 'KELUARGA' || kategori === 'AKADEMIK')
    ) {
      return {
        status: 'IZIN',
        aiBelumTersedia: false,
      };
    }

    // Fallback aman jika AI gagal, belum diproses, atau kategori tidak jelas
    return {
      status: 'IZIN',
      aiBelumTersedia: true,
    };
  }

  // 3. Tanpa presensi & tanpa izin DISETUJUI: cek apakah sesi sudah DITUTUP
  if (statusSesi === 'DITUTUP') {
    return {
      status: 'ALPHA',
      aiBelumTersedia: false,
    };
  }

  // 4. Sesi belum ditutup -> status sementara BELUM_HADIR
  return {
    status: 'BELUM_HADIR',
    aiBelumTersedia: false,
  };
}