import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Izin, Presensi } from '../../src/types';
import { tentukanStatusRekap } from '../../src/utils/tentukan-status-rekap';

const mockPresensi: Presensi = {
  idPresensi: 'sesi-1_uid-1',
  sesiId: 'sesi-1',
  kelasId: 'kelas-1',
  uid: 'uid-1',
  waktuHadir: new Date(),
};

const buatIzin = (overrides: Partial<Izin>): Izin => ({
  idIzin: 'izin-1',
  sesiId: 'sesi-1',
  kelasId: 'kelas-1',
  uid: 'uid-1',
  alasan: 'Alasan uji',
  statusIzin: 'MENUNGGU',
  diperiksaOleh: null,
  waktuPeriksa: null,
  kategoriAi: null,
  statusAi: 'BELUM',
  modelAi: null,
  waktuAi: null,
  dibuatPada: new Date(),
  ...overrides,
});

describe('tentukanStatusRekap', () => {
  it('1. Mengembalikan HADIR jika ada presensi (menang atas izin)', () => {
    const hasil = tentukanStatusRekap({
      presensi: mockPresensi,
      izin: buatIzin({
        statusIzin: 'DISETUJUI',
        kategoriAi: 'SAKIT' as never,
        statusAi: 'SUKSES',
      }),
      statusSesi: 'DITUTUP',
    });
    assert.deepEqual(hasil, { status: 'HADIR', aiBelumTersedia: false });
  });

  it('2. Mengembalikan SAKIT jika izin DISETUJUI dan kategori AI SAKIT', () => {
    const hasil = tentukanStatusRekap({
      presensi: null,
      izin: buatIzin({
        statusIzin: 'DISETUJUI',
        kategoriAi: 'SAKIT' as never,
        statusAi: 'SUKSES',
      }),
      statusSesi: 'DIBUKA',
    });
    assert.deepEqual(hasil, { status: 'SAKIT', aiBelumTersedia: false });
  });

  it('3. Mengembalikan IZIN jika izin DISETUJUI dan kategori AI IZIN', () => {
    const hasil = tentukanStatusRekap({
      presensi: null,
      izin: buatIzin({
        statusIzin: 'DISETUJUI',
        kategoriAi: 'IZIN' as never,
        statusAi: 'SUKSES',
      }),
      statusSesi: 'DITUTUP',
    });
    assert.deepEqual(hasil, { status: 'IZIN', aiBelumTersedia: false });
  });

  it('4. Fallback ke IZIN dengan aiBelumTersedia=true jika izin DISETUJUI tapi AI gagal', () => {
    const hasil = tentukanStatusRekap({
      presensi: null,
      izin: buatIzin({
        statusIzin: 'DISETUJUI',
        kategoriAi: null,
        statusAi: 'GAGAL',
      }),
      statusSesi: 'DITUTUP',
    });
    assert.deepEqual(hasil, { status: 'IZIN', aiBelumTersedia: true });
  });

  it('5. Mengembalikan ALPHA jika sesi DITUTUP tanpa presensi dan tanpa izin DISETUJUI', () => {
    const hasil = tentukanStatusRekap({
      presensi: null,
      izin: buatIzin({ statusIzin: 'DITOLAK' }),
      statusSesi: 'DITUTUP',
    });
    assert.deepEqual(hasil, { status: 'ALPHA', aiBelumTersedia: false });
  });

  it('6. Mengembalikan BELUM_HADIR jika sesi belum DITUTUP dan belum ada presensi/izin disetujui', () => {
    const hasil = tentukanStatusRekap({
      presensi: null,
      izin: buatIzin({ statusIzin: 'MENUNGGU' }),
      statusSesi: 'DIBUKA',
    });
    assert.deepEqual(hasil, { status: 'BELUM_HADIR', aiBelumTersedia: false });
  });
});