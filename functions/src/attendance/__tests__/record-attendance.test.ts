import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';
import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    evaluasiKelayakanPresensi,
    hitungJarakHaversineMeter,
    prosesRecordAttendance,
} from '../record-attendance';

const WAKTU_SERVER = 1_763_560_000_000;

const SESI_AKTIF = {
  idSesi: 'seed-sesi-ppb-03',
  kelasId: 'seed-kelas-ppb-a',
  statusSesi: 'DIBUKA',
  diarsipkan: false,
  tokenQrAktif: 'SEED-QR-PPB03',
};

const LAB_RPL = {
  latitude: -7.051945,
  longitude: 110.440125,
  radiusPresensi: 50,
  aktif: true,
};

const ANGGOTA_AKTIF = { status: 'AKTIF' };

function buatPayloadValid(override: Record<string, unknown> = {}) {
  return {
    sesiId: 'seed-sesi-ppb-03',
    buktiQr: 'SEED-QR-PPB03',
    koordinat: {
      latitude: -7.05199, // ~5 meter dari titik pusat lab
      longitude: 110.44013,
    },
    akurasi: 12,
    timestamp: WAKTU_SERVER - 3_000,
    ...override,
  };
}

describe('hitungJarakHaversineMeter', () => {
  it('mengembalikan 0 meter untuk dua titik koordinat yang sama persis', () => {
    const jarak = hitungJarakHaversineMeter(
      LAB_RPL.latitude,
      LAB_RPL.longitude,
      LAB_RPL.latitude,
      LAB_RPL.longitude,
    );
    assert.equal(jarak, 0);
  });

  it('menghitung jarak sekitar 111 meter untuk selisih 0.001 derajat lintang', () => {
    const jarak = hitungJarakHaversineMeter(-7.051, 110.44, -7.052, 110.44);
    assert.ok(jarak > 110 && jarak < 112, `Jarak terhitung: ${jarak}`);
  });
});

describe('evaluasiKelayakanPresensi', () => {
  it('lolos validasi saat berada di dalam radius dengan QR, keanggotaan, akurasi, dan timestamp valid', () => {
    const hasil = evaluasiKelayakanPresensi({
      sesi: SESI_AKTIF,
      lab: LAB_RPL,
      keanggotaan: ANGGOTA_AKTIF,
      izin: null,
      sudahPresensi: false,
      payload: buatPayloadValid(),
      waktuServerMs: WAKTU_SERVER,
    });

    assert.ok(hasil.jarakMeter <= 50);
    assert.equal(hasil.radiusPresensi, 50);
  });

  it('mendukung format payload QR JSON yang berisi sesiId dan token', () => {
    const hasil = evaluasiKelayakanPresensi({
      sesi: SESI_AKTIF,
      lab: LAB_RPL,
      keanggotaan: ANGGOTA_AKTIF,
      izin: null,
      sudahPresensi: false,
      payload: buatPayloadValid({
        buktiQr: JSON.stringify({
          sesiId: 'seed-sesi-ppb-03',
          token: 'SEED-QR-PPB03',
        }),
      }),
      waktuServerMs: WAKTU_SERVER,
    });

    assert.ok(hasil.jarakMeter <= 50);
  });

  it('menolak presensi jika posisi praktikan di luar radiusPresensi laboratorium', () => {
    assert.throws(
      () =>
        evaluasiKelayakanPresensi({
          sesi: SESI_AKTIF,
          lab: LAB_RPL,
          keanggotaan: ANGGOTA_AKTIF,
          izin: null,
          sudahPresensi: false,
          payload: buatPayloadValid({
            koordinat: {
              latitude: -7.053, // > 115 meter dari Lab RPL
              longitude: 110.440125,
            },
          }),
          waktuServerMs: WAKTU_SERVER,
        }),
      (err: unknown) =>
        err instanceof HttpsError && err.code === 'failed-precondition',
    );
  });

  it('menolak presensi jika kode QR salah atau milik sesi lain', () => {
    assert.throws(
      () =>
        evaluasiKelayakanPresensi({
          sesi: SESI_AKTIF,
          lab: LAB_RPL,
          keanggotaan: ANGGOTA_AKTIF,
          izin: null,
          sudahPresensi: false,
          payload: buatPayloadValid({ buktiQr: 'QR-PALSU-999' }),
          waktuServerMs: WAKTU_SERVER,
        }),
      (err: unknown) =>
        err instanceof HttpsError && err.code === 'invalid-argument',
    );
  });

  it('menolak presensi jika status sesi sudah DITUTUP', () => {
    assert.throws(
      () =>
        evaluasiKelayakanPresensi({
          sesi: { ...SESI_AKTIF, statusSesi: 'DITUTUP' },
          lab: LAB_RPL,
          keanggotaan: ANGGOTA_AKTIF,
          izin: null,
          sudahPresensi: false,
          payload: buatPayloadValid(),
          waktuServerMs: WAKTU_SERVER,
        }),
      (err: unknown) =>
        err instanceof HttpsError && err.code === 'failed-precondition',
    );
  });

  it('menolak presensi jika praktikan bukan anggota aktif kelas', () => {
    assert.throws(
      () =>
        evaluasiKelayakanPresensi({
          sesi: SESI_AKTIF,
          lab: LAB_RPL,
          keanggotaan: null,
          izin: null,
          sudahPresensi: false,
          payload: buatPayloadValid(),
          waktuServerMs: WAKTU_SERVER,
        }),
      (err: unknown) =>
        err instanceof HttpsError && err.code === 'permission-denied',
    );
  });

  it('menolak presensi jika akurasi GPS buruk (> 50m) atau timestamp kedaluwarsa (> 60s)', () => {
    assert.throws(
      () =>
        evaluasiKelayakanPresensi({
          sesi: SESI_AKTIF,
          lab: LAB_RPL,
          keanggotaan: ANGGOTA_AKTIF,
          izin: null,
          sudahPresensi: false,
          payload: buatPayloadValid({ akurasi: 85 }),
          waktuServerMs: WAKTU_SERVER,
        }),
      (err: unknown) =>
        err instanceof HttpsError && err.code === 'failed-precondition',
    );

    assert.throws(
      () =>
        evaluasiKelayakanPresensi({
          sesi: SESI_AKTIF,
          lab: LAB_RPL,
          keanggotaan: ANGGOTA_AKTIF,
          izin: null,
          sudahPresensi: false,
          payload: buatPayloadValid({ timestamp: WAKTU_SERVER - 90_000 }),
          waktuServerMs: WAKTU_SERVER,
        }),
      (err: unknown) =>
        err instanceof HttpsError && err.code === 'failed-precondition',
    );
  });
});

describe('prosesRecordAttendance (transaction & concurrent duplicate)', () => {
  it('menjaga idempotensi transaksi: 2 request bersamaan hanya menghasilkan 1 dokumen presensi', async () => {
    const store = new Map<string, Record<string, unknown>>([
      [
        'sesi/seed-sesi-ppb-03',
        {
          idSesi: 'seed-sesi-ppb-03',
          kelasId: 'seed-kelas-ppb-a',
          labId: 'seed-lab-rpl',
          statusSesi: 'DIBUKA',
          diarsipkan: false,
          tokenQrAktif: 'SEED-QR-PPB03',
        },
      ],
      [
        'laboratorium/seed-lab-rpl',
        {
          latitude: -7.051945,
          longitude: 110.440125,
          radiusPresensi: 50,
          aktif: true,
        },
      ],
      [
        'keanggotaan/seed-kelas-ppb-a_seed-praktikan-01',
        {
          status: 'AKTIF',
        },
      ],
    ]);

    // Serialized transaction lock untuk mensimulasikan isolasi Firestore Transaction
    let txLock = Promise.resolve();

    const makeDocRef = (path: string) => ({
      path,
      collection(subName: string) {
        return {
          doc(subId: string) {
            return makeDocRef(`${path}/${subName}/${subId}`);
          },
        };
      },
    });

    const mockDb = {
      collection(name: string) {
        return {
          doc(id: string) {
            return makeDocRef(`${name}/${id}`);
          },
          where() {
            return {
              where() {
                return {
                  limit() {
                    return { __isQuery: true };
                  },
                };
              },
            };
          },
        };
      },
      async runTransaction<T>(
        fn: (tx: {
          get: (target: unknown) => Promise<unknown>;
          set: (ref: { path: string }, data: Record<string, unknown>) => void;
        }) => Promise<T>,
      ): Promise<T> {
        const previousLock = txLock;
        let releaseLock!: () => void;
        txLock = new Promise<void>((resolve) => {
          releaseLock = resolve;
        });

        await previousLock;
        try {
          const pendingWrites: Array<{
            path: string;
            data: Record<string, unknown>;
          }> = [];

          const tx = {
            async get(target: unknown) {
              if (
                target &&
                typeof target === 'object' &&
                '__isQuery' in target
              ) {
                return { empty: true, docs: [] };
              }
              const ref = target as { path: string };
              const data = store.get(ref.path);
              return {
                exists: data !== undefined,
                data: () => data,
              };
            },
            set(ref: { path: string }, data: Record<string, unknown>) {
              pendingWrites.push({ path: ref.path, data });
            },
          };

          const result = await fn(tx);
          for (const write of pendingWrites) {
            store.set(write.path, write.data);
          }
          return result;
        } finally {
          releaseLock();
        }
      },
    } as unknown as admin.firestore.Firestore;

    const payload = buatPayloadValid();
    const [res1, res2] = await Promise.allSettled([
      prosesRecordAttendance(
        mockDb,
        'seed-praktikan-01',
        payload,
        WAKTU_SERVER,
      ),
      prosesRecordAttendance(
        mockDb,
        'seed-praktikan-01',
        payload,
        WAKTU_SERVER,
      ),
    ]);

    const sukses = [res1, res2].filter((r) => r.status === 'fulfilled');
    const gagal = [res1, res2].filter((r) => r.status === 'rejected');

    assert.equal(sukses.length, 1);
    assert.equal(gagal.length, 1);

    const rejectedReason = (gagal[0] as PromiseRejectedResult).reason;
    assert.ok(rejectedReason instanceof HttpsError);
    assert.equal(rejectedReason.code, 'already-exists');

    const savedDoc = store.get(
      'presensi/seed-sesi-ppb-03_seed-praktikan-01',
    );
    assert.ok(savedDoc);
    assert.equal(
      savedDoc.idPresensi,
      'seed-sesi-ppb-03_seed-praktikan-01',
    );
  });
});