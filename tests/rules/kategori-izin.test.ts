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
  ['KESEHATAN', 'SAKIT', 'SAKIT'], ['KELUARGA', 'IZIN', 'IZIN'],
  ['AKADEMIK', 'IZIN', 'IZIN'], ['LAINNYA', 'IZIN', 'IZIN'],
  ['ALPHA', null, 'IZIN'], ['TIDAK_JELAS', null, 'IZIN'],
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

test('respons baru hanya menerima dua kategori persis, tanpa normalisasi legacy', () => {
  assert.equal(adalahKategoriIzin('SAKIT'), true);
  assert.equal(adalahKategoriIzin('IZIN'), true);
  for (const nilai of ['ALPHA', 'KESEHATAN', 'KELUARGA', 'AKADEMIK', 'LAINNYA', 'TIDAK_JELAS', 'sakit', ' SAKIT ', null, {}, 1]) {
    assert.equal(adalahKategoriIzin(nilai), false);
  }
});
