import type * as admin from 'firebase-admin';
import * as assert from 'node:assert/strict';
import test from 'node:test';

import {
    cekTransisiSesiDibuka,
    prosesNotifikasiSesiDibuka,
    type PayloadNotifikasiSesiDibuka,
} from '../on-session-opened';

test('cekTransisiSesiDibuka hanya mengembalikan data jika BELUM_DIBUKA -> DIBUKA', () => {
  assert.equal(
    cekTransisiSesiDibuka({
      sesiId: 'sesi-1',
      beforeData: { statusSesi: 'DIBUKA', kelasId: 'k1' },
      afterData: { statusSesi: 'DIBUKA', kelasId: 'k1' },
    }),
    null,
  );

  assert.equal(
    cekTransisiSesiDibuka({
      sesiId: 'sesi-1',
      beforeData: { statusSesi: 'DIBUKA', kelasId: 'k1' },
      afterData: { statusSesi: 'DITUTUP', kelasId: 'k1' },
    }),
    null,
  );

  const valid = cekTransisiSesiDibuka({
    sesiId: 'sesi-1',
    beforeData: { statusSesi: 'BELUM_DIBUKA', kelasId: 'k1' },
    afterData: {
      statusSesi: 'DIBUKA',
      kelasId: 'k1',
      judul: 'Pertemuan 3',
      lokasi: 'Lab RPL',
    },
  });

  assert.deepEqual(valid, {
    sesiId: 'sesi-1',
    kelasId: 'k1',
    judulSesi: 'Pertemuan 3',
    lokasi: 'Lab RPL',
  });
});

test('prosesNotifikasiSesiDibuka hanya mengirim ke praktikan AKTIF dengan idempotencyKey', async () => {
  const terkirim: PayloadNotifikasiSesiDibuka[] = [];

  const mockDb = {
    collection(name: string) {
      if (name === 'kelas') {
        return {
          doc() {
            return {
              async get() {
                return {
                  exists: true,
                  data: () => ({
                    namaPraktikum: 'Pemrograman Perangkat Bergerak',
                    asistenUid: 'uid-asisten',
                    diarsipkan: false,
                  }),
                };
              },
            };
          },
        };
      }

      if (name === 'keanggotaan') {
        return {
          where() {
            return this;
          },
          async get() {
            return {
              docs: [
                { data: () => ({ uid: 'uid-praktikan-1', status: 'AKTIF' }) },
                { data: () => ({ uid: 'uid-praktikan-2', status: 'AKTIF' }) },
                { data: () => ({ uid: 'uid-praktikan-1', status: 'AKTIF' }) }, // duplikat
              ],
            };
          },
        };
      }

      throw new Error(`Unexpected collection ${name}`);
    },
  } as unknown as admin.firestore.Firestore;

  const hasil = await prosesNotifikasiSesiDibuka(
    mockDb,
    {
      sesiId: 'seed-sesi-ppb-03',
      beforeData: { statusSesi: 'BELUM_DIBUKA', kelasId: 'seed-kelas-ppb-a' },
      afterData: {
        statusSesi: 'DIBUKA',
        kelasId: 'seed-kelas-ppb-a',
        judul: 'Pertemuan 3',
        lokasi: 'Lab RPL (E-301)',
      },
    },
    async (payload) => {
      terkirim.push(payload);
    },
  );

  assert.equal(hasil.dikirim, true);
  assert.equal(hasil.jumlahPenerima, 2);
  assert.equal(hasil.idempotencyKey, 'session-opened:seed-sesi-ppb-03');
  assert.equal(terkirim.length, 1);
  assert.deepEqual(terkirim[0].recipientUids, ['uid-praktikan-1', 'uid-praktikan-2']);
});