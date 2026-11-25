import assert from 'node:assert/strict';
import test from 'node:test';
import type { Firestore } from 'firebase-admin/firestore';

import {
  buatHandlerPresensi,
  prosesPresensi,
  validasiBuktiQr,
} from '../api/presensi.js';

const WAKTU_SERVER = 1_763_560_000_000;
const KODE_QR = '0123456789abcdef0123456789abcdef';
const SESI_ID = 'sesi-ppk-01';
const KELAS_ID = 'kelas-ppk-a';
const PRAKTIKAN_UID = 'praktikan-01';
const LAB_ID = 'lab-b';

interface MockWhereFilter {
  field: string;
  value: unknown;
}

function buatMockFirestore(initialEntries: Array<[string, Record<string, unknown>]>) {
  const store = new Map<string, Record<string, unknown>>(initialEntries);
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

  const makeQuery = (collectionName: string, filters: MockWhereFilter[], maxLimit?: number) => ({
    __isQuery: true,
    collectionName,
    filters,
    maxLimit,
    where(field: string, _op: string, value: unknown) {
      return makeQuery(collectionName, [...filters, { field, value }], maxLimit);
    },
    limit(n: number) {
      return makeQuery(collectionName, filters, n);
    },
  });

  const db = {
    collection(name: string) {
      return {
        doc(id: string) {
          return makeDocRef(`${name}/${id}`);
        },
        where(field: string, _op: string, value: unknown) {
          return makeQuery(name, [{ field, value }]);
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
        const pendingWrites: Array<{ path: string; data: Record<string, unknown> }> = [];

        const tx = {
          async get(target: unknown) {
            if (target && typeof target === 'object' && '__isQuery' in target) {
              const q = target as ReturnType<typeof makeQuery>;
              const prefix = `${q.collectionName}/`;
              const docs: Array<{ id: string; data: () => Record<string, unknown> }> = [];

              for (const [docPath, docData] of store.entries()) {
                if (!docPath.startsWith(prefix)) continue;
                const rest = docPath.slice(prefix.length);
                if (rest.includes('/')) continue;

                const matches = q.filters.every((f) => docData[f.field] === f.value);
                if (matches) {
                  docs.push({ id: rest, data: () => docData });
                }
              }

              const sliced = q.maxLimit !== undefined ? docs.slice(0, q.maxLimit) : docs;
              return { empty: sliced.length === 0, docs: sliced };
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
  } as unknown as Firestore;

  return { db, store };
}

function dataDasar(): Array<[string, Record<string, unknown>]> {
  return [
    [`pengguna/${PRAKTIKAN_UID}`, { uid: PRAKTIKAN_UID, peran: 'PRAKTIKAN' }],
    ['pengguna/asisten-01', { uid: 'asisten-01', peran: 'ASISTEN' }],
    [
      `kelas/${KELAS_ID}`,
      { namaPraktikum: 'PPK A2', asistenUid: 'asisten-01', diarsipkan: false },
    ],
    [
      `keanggotaan/${KELAS_ID}_${PRAKTIKAN_UID}`,
      { kelasId: KELAS_ID, uid: PRAKTIKAN_UID, status: 'AKTIF' },
    ],
    [
      `laboratorium/${LAB_ID}`,
      {
        kodeLab: 'B',
        nama: 'Lab B',
        lokasiGedung: 'Gedung E Lt. 2',
        latitude: -7.0482375,
        longitude: 110.440765625,
        radiusPresensi: 40,
        aktif: true,
      },
    ],
    [
      `sesi/${SESI_ID}`,
      {
        kelasId: KELAS_ID,
        judul: 'Pertemuan 2',
        labId: LAB_ID,
        lokasi: 'Lab B',
        statusSesi: 'DIBUKA',
        diarsipkan: false,
      },
    ],
    [`sesi/${SESI_ID}/rahasia/qr`, { kodeQr: KODE_QR }],
  ];
}

function bodyValid(override: Record<string, unknown> = {}) {
  return {
    sesiId: SESI_ID,
    buktiQr: `hadirin:${SESI_ID}:${KODE_QR}`,
    koordinat: {
      latitude: -7.04825,
      longitude: 110.44078,
    },
    akurasi: 10,
    timestamp: WAKTU_SERVER - 2_000,
    ...override,
  };
}

function buatRequest(
  body: unknown = bodyValid(),
  options: { method?: string; token?: string | null } = {},
) {
  const method = options.method ?? 'POST';
  const token = options.token === undefined ? 'token-praktikan' : options.token;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (method === 'POST') headers['Content-Type'] = 'application/json';

  return new Request('https://proxy.example/api/presensi', {
    method,
    headers,
    ...(method === 'POST' ? { body: JSON.stringify(body) } : {}),
  });
}

function siapkanHandler(
  entries: Array<[string, Record<string, unknown>]> = dataDasar(),
  uidToken = PRAKTIKAN_UID,
) {
  const { db, store } = buatMockFirestore(entries);
  const handler = buatHandlerPresensi({
    verifikasiToken: async () => ({ uid: uidToken }),
    catatPresensi: (uid, payload) => prosesPresensi(db, uid, payload, WAKTU_SERVER),
  });
  return { handler, db, store };
}

async function json(res: Response): Promise<Record<string, unknown>> {
  return (await res.json()) as Record<string, unknown>;
}

test('GET /api/presensi mengembalikan status layanan aktif', async () => {
  const { handler } = siapkanHandler();
  const res = await handler(buatRequest(undefined, { method: 'GET', token: null }));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await json(res), { ok: true, data: { layanan: 'presensi', aktif: true } });
});

test('validasiBuktiQr mendukung format hadirin:sesi:kode dan menolak sesi lain', () => {
  assert.equal(validasiBuktiQr(`hadirin:${SESI_ID}:${KODE_QR}`, SESI_ID, KODE_QR), true);
  assert.equal(validasiBuktiQr(`hadirin:sesi-lain:${KODE_QR}`, SESI_ID, KODE_QR), false);
  assert.equal(validasiBuktiQr(`hadirin://presensi?sesi=${SESI_ID}&qr=${KODE_QR}`, SESI_ID, KODE_QR), true);
  assert.equal(validasiBuktiQr(KODE_QR, SESI_ID, KODE_QR), true);
});

test('presensi valid di dalam radius berhasil dicatat dengan jarakMeter dan waktuHadir', async () => {
  const { handler, store } = siapkanHandler();
  const res = await handler(buatRequest());
  const body = await json(res);

  assert.equal(res.status, 200);
  assert.equal(body.ok, true);
  const data = body.data as Record<string, unknown>;
  assert.equal(data.idPresensi, `${SESI_ID}_${PRAKTIKAN_UID}`);
  assert.equal(data.uid, PRAKTIKAN_UID);
  assert.equal(data.kelasId, KELAS_ID);
  assert.ok(typeof data.jarakMeter === 'number' && data.jarakMeter <= 40);

  const saved = store.get(`presensi/${SESI_ID}_${PRAKTIKAN_UID}`);
  assert.ok(saved);
  assert.equal(saved.idPresensi, `${SESI_ID}_${PRAKTIKAN_UID}`);
  assert.equal(saved.uid, PRAKTIKAN_UID);
  assert.equal(typeof saved.jarakMeter, 'number');
});

test('request paralel ganda hanya mencatat 1 dokumen presensi', async () => {
  const { handler, store } = siapkanHandler();
  const [res1, res2] = await Promise.all([
    handler(buatRequest()),
    handler(buatRequest()),
  ]);

  const statuses = [res1.status, res2.status].sort((a, b) => a - b);
  assert.deepEqual(statuses, [200, 409]);

  const bodies = await Promise.all([json(res1), json(res2)]);
  const gagal = bodies.find((b) => b.ok === false);
  assert.equal(gagal?.alasan, 'SUDAH_PRESENSI');
  assert.ok(store.get(`presensi/${SESI_ID}_${PRAKTIKAN_UID}`));
});

test('menolak token hilang, token gagal verifikasi, peran bukan PRAKTIKAN, dan field spoofed uid', async () => {
  const { handler } = siapkanHandler();

  const tanpaToken = await handler(buatRequest(bodyValid(), { token: null }));
  assert.equal(tanpaToken.status, 401);
  assert.equal((await json(tanpaToken)).alasan, 'AUTENTIKASI_GAGAL');

  const { db } = buatMockFirestore(dataDasar());
  const handlerTokenInvalid = buatHandlerPresensi({
    verifikasiToken: async () => {
      throw new Error('invalid token');
    },
    catatPresensi: (uid, payload) => prosesPresensi(db, uid, payload, WAKTU_SERVER),
  });
  const tokenInvalid = await handlerTokenInvalid(buatRequest());
  assert.equal(tokenInvalid.status, 401);
  assert.equal((await json(tokenInvalid)).alasan, 'AUTENTIKASI_GAGAL');

  const handlerAsisten = siapkanHandler(dataDasar(), 'asisten-01');
  const bukanPraktikan = await handlerAsisten.handler(buatRequest());
  assert.equal(bukanPraktikan.status, 403);
  assert.equal((await json(bukanPraktikan)).alasan, 'TIDAK_BERWENANG');

  const spoofedUid = await handler(buatRequest({ ...bodyValid(), uid: 'korban-uid' }));
  assert.equal(spoofedUid.status, 400);
  assert.equal((await json(spoofedUid)).alasan, 'INPUT_TIDAK_VALID');

  const spoofedJarak = await handler(buatRequest({ ...bodyValid(), jarakMeter: 0 }));
  assert.equal(spoofedJarak.status, 400);
  assert.equal((await json(spoofedJarak)).alasan, 'INPUT_TIDAK_VALID');
});

type StoreEntry = [string, Record<string, unknown>];

function ubahEntri(
  targetKey: string,
  updater: (data: Record<string, unknown>) => Record<string, unknown>,
): StoreEntry[] {
  return dataDasar().map(([k, v]): StoreEntry =>
    k === targetKey ? [k, updater(v)] : [k, v],
  );
}

test('menolak sesi BELUM_DIBUKA, DITUTUP, diarsipkan, QR salah, dan bukan anggota', async () => {
  const resBelum = await siapkanHandler(
    ubahEntri(`sesi/${SESI_ID}`, (v) => ({ ...v, statusSesi: 'BELUM_DIBUKA' })),
  ).handler(buatRequest());
  assert.equal(resBelum.status, 409);
  assert.equal((await json(resBelum)).alasan, 'BELUM_DIBUKA');

  const resTutup = await siapkanHandler(
    ubahEntri(`sesi/${SESI_ID}`, (v) => ({ ...v, statusSesi: 'DITUTUP' })),
  ).handler(buatRequest());
  assert.equal(resTutup.status, 409);
  assert.equal((await json(resTutup)).alasan, 'SUDAH_DITUTUP');

  const resArsip = await siapkanHandler(
    ubahEntri(`kelas/${KELAS_ID}`, (v) => ({ ...v, diarsipkan: true })),
  ).handler(buatRequest());
  assert.equal(resArsip.status, 409);
  assert.equal((await json(resArsip)).alasan, 'DATA_DIARSIPKAN');

  const resQrSalah = await siapkanHandler().handler(
    buatRequest(bodyValid({ buktiQr: `hadirin:${SESI_ID}:salah` })),
  );
  assert.equal(resQrSalah.status, 422);
  assert.equal((await json(resQrSalah)).alasan, 'QR_TIDAK_VALID');

  const resNonAnggota = await siapkanHandler(
    ubahEntri(`keanggotaan/${KELAS_ID}_${PRAKTIKAN_UID}`, (v) => ({ ...v, status: 'NONAKTIF' })),
  ).handler(buatRequest());
  assert.equal(resNonAnggota.status, 403);
  assert.equal((await json(resNonAnggota)).alasan, 'BUKAN_ANGGOTA');
});

test('menolak izin MENUNGGU atau DISETUJUI dan mengizinkan jika izin DITOLAK', async () => {
  const izinMenunggu: StoreEntry[] = [
    ...dataDasar(),
    [`izin/${SESI_ID}_${PRAKTIKAN_UID}`, { sesiId: SESI_ID, uid: PRAKTIKAN_UID, statusIzin: 'MENUNGGU' }],
  ];
  const resMenunggu = await siapkanHandler(izinMenunggu).handler(buatRequest());
  assert.equal(resMenunggu.status, 409);
  assert.equal((await json(resMenunggu)).alasan, 'ADA_IZIN');

  const izinDisetujui: StoreEntry[] = [
    ...dataDasar(),
    [`izin/${SESI_ID}_${PRAKTIKAN_UID}`, { sesiId: SESI_ID, uid: PRAKTIKAN_UID, statusIzin: 'DISETUJUI' }],
  ];
  const resSetuju = await siapkanHandler(izinDisetujui).handler(buatRequest());
  assert.equal(resSetuju.status, 409);
  assert.equal((await json(resSetuju)).alasan, 'ADA_IZIN');

  const izinDitolak: StoreEntry[] = [
    ...dataDasar(),
    [`izin/${SESI_ID}_${PRAKTIKAN_UID}`, { sesiId: SESI_ID, uid: PRAKTIKAN_UID, statusIzin: 'DITOLAK' }],
  ];
  const resDitolak = await siapkanHandler(izinDitolak).handler(buatRequest());
  assert.equal(resDitolak.status, 200);
});

test('menolak posisi di luar radius, akurasi buruk, timestamp kedaluwarsa, lab nonaktif, dan konfigurasi lab invalid', async () => {
  const { handler } = siapkanHandler();

  const luarRadius = await handler(
    buatRequest(
      bodyValid({
        koordinat: { latitude: -7.0495, longitude: 110.440765625 },
      }),
    ),
  );
  assert.equal(luarRadius.status, 422);
  const luarBody = await json(luarRadius);
  assert.equal(luarBody.alasan, 'INPUT_TIDAK_VALID');
  assert.match(String(luarBody.pesan), /di luar area laboratorium/);

  const akurasiBuruk = await handler(buatRequest(bodyValid({ akurasi: 80 })));
  assert.equal(akurasiBuruk.status, 422);
  assert.equal((await json(akurasiBuruk)).alasan, 'INPUT_TIDAK_VALID');

  const timestampStale = await handler(
    buatRequest(bodyValid({ timestamp: WAKTU_SERVER - 65_000 })),
  );
  assert.equal(timestampStale.status, 422);
  assert.equal((await json(timestampStale)).alasan, 'INPUT_TIDAK_VALID');

  const resNonaktif = await siapkanHandler(
    ubahEntri(`laboratorium/${LAB_ID}`, (v) => ({ ...v, aktif: false })),
  ).handler(buatRequest());
  assert.equal(resNonaktif.status, 409);
  assert.equal((await json(resNonaktif)).alasan, 'DATA_TIDAK_DITEMUKAN');

  const resRadiusInvalid = await siapkanHandler(
    ubahEntri(`laboratorium/${LAB_ID}`, (v) => ({ ...v, radiusPresensi: 0 })),
  ).handler(buatRequest());
  assert.equal(resRadiusInvalid.status, 422);
  assert.equal((await json(resRadiusInvalid)).alasan, 'DATA_TIDAK_DITEMUKAN');
});

test('mendukung fallback pencarian laboratorium berdasarkan field nama saat labId kosong', async () => {
  const tanpaLabId = ubahEntri(`sesi/${SESI_ID}`, (v) => {
    const rest = { ...v };
    delete rest.labId;
    return rest;
  });

  const res = await siapkanHandler(tanpaLabId).handler(buatRequest());
  assert.equal(res.status, 200);
  assert.equal((await json(res)).ok, true);
});
