import type * as admin from 'firebase-admin';
import * as assert from 'node:assert/strict';
import test from 'node:test';

import {
  cekPerubahanJadwalSesi,
  prosesNotifikasiJadwalDiperbarui,
  type PayloadNotifikasiJadwalDiperbarui,
} from '../on-schedule-updated';

const beforeData = {
  kelasId: 'kelas-1',
  judul: 'Pertemuan 1',
  waktuMulai: 1000,
  waktuSelesai: 2000,
  labId: 'lab-1',
  statusSesi: 'DIBUKA',
};

test('tidak memicu notifikasi jika hanya status sesi berubah', () => {
  assert.equal(
    cekPerubahanJadwalSesi({
      sesiId: 'sesi-1',
      eventId: 'event-1',
      beforeData,
      afterData: { ...beforeData, statusSesi: 'DITUTUP' },
    }),
    null,
  );
});

test('mendeteksi perubahan judul, waktu, dan laboratorium', () => {
  const hasil = cekPerubahanJadwalSesi({
    sesiId: 'sesi-1',
    eventId: 'event-2',
    beforeData,
    afterData: {
      ...beforeData,
      judul: 'Pertemuan 2',
      waktuMulai: 3000,
      labId: 'lab-2',
    },
  });

  assert.deepEqual(hasil, {
    sesiId: 'sesi-1',
    kelasId: 'kelas-1',
    judulSesi: 'Pertemuan 2',
    fieldBerubah: ['judul', 'waktuMulai', 'labId'],
  });
});

test('tidak memicu notifikasi jika data jadwal tidak berubah', () => {
  assert.equal(
    cekPerubahanJadwalSesi({
      sesiId: 'sesi-1',
      eventId: 'event-3',
      beforeData,
      afterData: { ...beforeData },
    }),
    null,
  );
});

test('tidak memicu notifikasi untuk sesi yang diarsipkan', () => {
  assert.equal(
    cekPerubahanJadwalSesi({
      sesiId: 'sesi-1',
      eventId: 'event-4',
      beforeData,
      afterData: { ...beforeData, judul: 'Judul baru', diarsipkan: true },
    }),
    null,
  );
});

test('mengirim payload ke anggota aktif tanpa UID duplikat atau asisten', async () => {
  const terkirim: PayloadNotifikasiJadwalDiperbarui[] = [];

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
                { data: () => ({ uid: 'uid-1' }) },
                { data: () => ({ uid: 'uid-2' }) },
                { data: () => ({ uid: 'uid-1' }) },
                { data: () => ({ uid: 'uid-asisten' }) },
              ],
            };
          },
        };
      }

      throw new Error(`Unexpected collection ${name}`);
    },
  } as unknown as admin.firestore.Firestore;

  const hasil = await prosesNotifikasiJadwalDiperbarui(
    mockDb,
    {
      sesiId: 'sesi-1',
      eventId: 'event-123',
      beforeData,
      afterData: { ...beforeData, judul: 'Pertemuan 2' },
    },
    async (payload: PayloadNotifikasiJadwalDiperbarui) => {
      terkirim.push(payload);
    },
  );

  assert.equal(hasil.dikirim, true);
  assert.equal(hasil.jumlahPenerima, 2);
  assert.equal(
    hasil.idempotencyKey,
    'schedule-updated:sesi-1:event-123',
  );
  assert.equal(terkirim.length, 1);
  assert.deepEqual(terkirim[0].recipientUids, ['uid-1', 'uid-2']);
  assert.equal(terkirim[0].eventType, 'JADWAL_BERUBAH');
});