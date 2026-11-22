import assert from 'node:assert/strict';
import test from 'node:test';
import type { Izin } from '../../src/types';
import { adalahKategoriIzin, normalisasiKategoriIzinTersimpan } from '../../src/utils/kategori-izin';
import { tentukanStatusRekap } from '../../src/utils/tentukan-status-rekap';

const izin: Izin = {
  idIzin: 'izin-1', sesiId: 'sesi-1', kelasId: 'kelas-1', uid: 'praktikan-1',
  alasan: 'Alasan uji', statusIzin: 'DISETUJUI', diperiksaOleh: 'asisten-1',
  waktuPeriksa: null, kategoriAi: null, statusAi: 'SUKSES', modelAi: null,
  waktuAi: null, dibuatPada: null,
};

for (const [tersimpan, kategori, status] of [
  ['SAKIT', 'SAKIT', 'SAKIT'], ['IZIN', 'IZIN', 'IZIN'],
  ['KESEHATAN', 'SAKIT', 'SAKIT'], ['KELUARGA', null, 'IZIN'],
  ['AKADEMIK', null, 'IZIN'], ['LAINNYA', null, 'IZIN'],
  ['ALPHA', 'ALPHA', 'IZIN'], ['TIDAK_JELAS', null, 'IZIN'],
  ['INVALID', null, 'IZIN'], [null, null, 'IZIN'],
] as const) {
  test(`data tersimpan ${tersimpan}: kategori dan fallback rekap sesuai`, () => {
    const kategoriAi = normalisasiKategoriIzinTersimpan(tersimpan);
    assert.equal(kategoriAi, kategori);
    for (const statusSesi of ['DIBUKA', 'DITUTUP'] as const) {
      assert.deepEqual(tentukanStatusRekap({ izin: { ...izin, kategoriAi }, statusSesi }), {
        status, aiBelumTersedia: kategori === null,
      });
    }
  });
}

test('respons baru hanya menerima tiga kategori persis, tanpa normalisasi legacy', () => {
  assert.equal(adalahKategoriIzin('SAKIT'), true);
  assert.equal(adalahKategoriIzin('IZIN'), true);
  assert.equal(adalahKategoriIzin('ALPHA'), true);
  for (const nilai of ['KESEHATAN', 'KELUARGA', 'AKADEMIK', 'LAINNYA', 'TIDAK_JELAS', 'sakit', ' SAKIT ', null, {}, 1]) {
    assert.equal(adalahKategoriIzin(nilai), false);
  }
});

for (const statusSesi of ['BELUM_DIBUKA', 'DIBUKA', 'DITUTUP'] as const) {
  test(`AI ALPHA + keputusan DISETUJUI tetap IZIN saat ${statusSesi}`, () => {
    assert.deepEqual(tentukanStatusRekap({ izin: { ...izin, kategoriAi: 'ALPHA' }, statusSesi }), {
      status: 'IZIN', aiBelumTersedia: false,
    });
  });
}

test('AI ALPHA tidak otomatis memutuskan izin pending dan tidak mengalahkan presensi', () => {
  const pending = { ...izin, kategoriAi: 'ALPHA' as const, statusIzin: 'MENUNGGU' as const };
  assert.equal(tentukanStatusRekap({ izin: pending, statusSesi: 'DIBUKA' }).status, 'BELUM_HADIR');
  assert.equal(tentukanStatusRekap({ izin: pending, statusSesi: 'DITUTUP' }).status, 'ALPHA');
  assert.equal(tentukanStatusRekap({ izin: pending, statusSesi: 'DITUTUP',
    presensi: { idPresensi: 'p', sesiId: 'sesi-1', kelasId: 'kelas-1', uid: 'praktikan-1', waktuHadir: new Date() },
  }).status, 'HADIR');
});
