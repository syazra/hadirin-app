import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { firebaseAdminApp } from '../firebase-admin-app';

export const BATAS_AKURASI_MAKSIMAL_METER = 50;
export const BATAS_USIA_TIMESTAMP_MS = 60_000;
export const TOLERANSI_MASA_DEPAN_MS = 15_000;

export type AlasanGagalPresensi =
  | 'BELUM_DIBUKA'
  | 'SUDAH_DITUTUP'
  | 'SUDAH_PRESENSI'
  | 'QR_TIDAK_VALID'
  | 'BUKAN_ANGGOTA'
  | 'ADA_IZIN'
  | 'DATA_TIDAK_DITEMUKAN'
  | 'TIDAK_BERWENANG'
  | 'INPUT_TIDAK_VALID'
  | 'DATA_DIARSIPKAN'
  | 'AUTENTIKASI_GAGAL'
  | 'JARINGAN'
  | 'TIMEOUT'
  | 'RESPONS_TIDAK_VALID'
  | 'TIDAK_DIKENAL';

export interface RecordAttendancePayload {
  sesiId: string;
  buktiQr: string;
  koordinat: {
    latitude: number;
    longitude: number;
  };
  akurasi: number;
  timestamp: number;
}

export interface RecordAttendanceResponse {
  idPresensi: string;
  sesiId: string;
  kelasId: string;
  uid: string;
  jarakMeter: number;
  radiusPresensi: number;
  waktuHadirIso: string;
}

export interface DependensiPresensi {
  verifikasiToken: (token: string) => Promise<{ uid: string }>;
  catatPresensi: (
    uid: string,
    payload: RecordAttendancePayload,
  ) => Promise<RecordAttendanceResponse>;
}

export class PresensiError extends Error {
  constructor(
    readonly status: number,
    readonly alasan: AlasanGagalPresensi,
    message: string,
  ) {
    super(message);
    this.name = 'PresensiError';
  }
}

function adalahObjek(nilai: unknown): nilai is Record<string, unknown> {
  return typeof nilai === 'object' && nilai !== null && !Array.isArray(nilai);
}

function tokenDariHeader(authorization: string | null): string | null {
  const match = authorization?.match(/^Bearer\s+([^\s]+)$/i);
  return match?.[1] ?? null;
}

function respons(
  status: number,
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

/**
 * Menghitung jarak antara dua titik koordinat (dalam meter) menggunakan rumus Haversine.
 */
export function hitungJarakHaversineMeter(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Memvalidasi bukti QR terhadap sesiId dan tokenQrAktif dari Firestore.
 * Mendukung format utama `hadirin:<idSesi>:<kodeQr>`, deep link, JSON, dan token mentah.
 */
export function validasiBuktiQr(
  buktiQrRaw: string,
  sesiId: string,
  tokenQrAktif: string | null | undefined,
): boolean {
  const bukti = buktiQrRaw.trim();
  if (!bukti || !tokenQrAktif) {
    return false;
  }

  const tokenAktif = tokenQrAktif.trim();
  if (!tokenAktif) {
    return false;
  }

  // 1. Format Deep Link / URI: hadirin://presensi?sesi=<sesiId>&qr=<kodeQr>
  if (bukti.startsWith('hadirin://')) {
    try {
      const url = new URL(bukti);
      const idSesiQr = url.searchParams.get('sesi')?.trim() ?? '';
      const tokenDariQr = url.searchParams.get('qr')?.trim() ?? '';

      if (!idSesiQr || idSesiQr !== sesiId) {
        return false;
      }

      return tokenDariQr === tokenAktif;
    } catch {
      return false;
    }
  }

  // 2. Format utama aplikasi: hadirin:<idSesi>:<kodeQr>
  if (bukti.startsWith('hadirin:')) {
    const bagian = bukti.split(':');
    const [awalan, idSesiQr, kodeQr] = bagian;

    if (
      bagian.length !== 3 ||
      awalan !== 'hadirin' ||
      !idSesiQr ||
      !kodeQr ||
      /\s/.test(idSesiQr + kodeQr)
    ) {
      return false;
    }

    return idSesiQr === sesiId && kodeQr === tokenAktif;
  }

  // 3. Format JSON: { idSesi/sesiId, kodeQr/token }
  if (bukti.startsWith('{')) {
    try {
      const parsed = JSON.parse(bukti) as {
        idSesi?: unknown;
        sesiId?: unknown;
        kodeQr?: unknown;
        token?: unknown;
      };

      const idSesiQr =
        typeof parsed.idSesi === 'string'
          ? parsed.idSesi
          : typeof parsed.sesiId === 'string'
            ? parsed.sesiId
            : null;

      if (idSesiQr !== null && idSesiQr !== sesiId) {
        return false;
      }

      const tokenDariQr =
        typeof parsed.kodeQr === 'string'
          ? parsed.kodeQr
          : typeof parsed.token === 'string'
            ? parsed.token
            : '';

      return tokenDariQr.trim() === tokenAktif;
    } catch {
      return false;
    }
  }

  // 4. Format token mentah
  return bukti === tokenAktif;
}

const KUNCI_PAYLOAD_UTAMA = new Set([
  'sesiId',
  'buktiQr',
  'koordinat',
  'akurasi',
  'timestamp',
]);
const KUNCI_KOORDINAT = new Set(['latitude', 'longitude']);

export function bacaPayloadPresensi(body: unknown): RecordAttendancePayload | null {
  if (!adalahObjek(body)) {
    return null;
  }

  const keys = Object.keys(body);
  if (
    keys.length !== KUNCI_PAYLOAD_UTAMA.size ||
    keys.some((key) => !KUNCI_PAYLOAD_UTAMA.has(key))
  ) {
    return null;
  }

  if (typeof body.sesiId !== 'string' || typeof body.buktiQr !== 'string') {
    return null;
  }

  const sesiId = body.sesiId.trim();
  const buktiQr = body.buktiQr.trim();

  if (
    sesiId.length === 0 ||
    sesiId.length > 256 ||
    sesiId.includes('/') ||
    buktiQr.length === 0 ||
    buktiQr.length > 1024
  ) {
    return null;
  }

  if (!adalahObjek(body.koordinat)) {
    return null;
  }

  const coordKeys = Object.keys(body.koordinat);
  if (
    coordKeys.length !== KUNCI_KOORDINAT.size ||
    coordKeys.some((key) => !KUNCI_KOORDINAT.has(key))
  ) {
    return null;
  }

  const { latitude, longitude } = body.koordinat;
  const { akurasi, timestamp } = body;

  if (
    typeof latitude !== 'number' ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    typeof longitude !== 'number' ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180 ||
    typeof akurasi !== 'number' ||
    !Number.isFinite(akurasi) ||
    typeof timestamp !== 'number' ||
    !Number.isFinite(timestamp)
  ) {
    return null;
  }

  return {
    sesiId,
    buktiQr,
    koordinat: { latitude, longitude },
    akurasi,
    timestamp,
  };
}

export interface EvaluasiKelayakanInput {
  peran: string | null;
  sesi: {
    idSesi: string;
    kelasId: string;
    statusSesi: string;
    diarsipkan: boolean;
    tokenQrAktif: string | null;
  };
  kelas: {
    exists: boolean;
    diarsipkan: boolean;
  };
  keanggotaan: {
    exists: boolean;
    status: string;
  };
  sudahPresensi: boolean;
  izin: {
    statusIzin: string;
  } | null;
  lab: {
    exists: boolean;
    aktif: boolean;
    latitude: number;
    longitude: number;
    radiusPresensi: number;
  };
  payload: RecordAttendancePayload;
  waktuServerMs: number;
}

export function evaluasiKelayakanPresensi(
  input: EvaluasiKelayakanInput,
): { jarakMeter: number; radiusPresensi: number } {
  const {
    peran,
    sesi,
    kelas,
    keanggotaan,
    sudahPresensi,
    izin,
    lab,
    payload,
    waktuServerMs,
  } = input;

  if (peran !== 'PRAKTIKAN') {
    throw new PresensiError(
      403,
      'TIDAK_BERWENANG',
      'Hanya praktikan yang dapat melakukan presensi.',
    );
  }

  if (!kelas.exists) {
    throw new PresensiError(
      404,
      'DATA_TIDAK_DITEMUKAN',
      'Kelas praktikum tidak ditemukan.',
    );
  }

  if (sesi.diarsipkan || kelas.diarsipkan) {
    throw new PresensiError(
      409,
      'DATA_DIARSIPKAN',
      'Kelas atau sesi praktikum ini sudah diarsipkan.',
    );
  }

  if (sesi.statusSesi === 'BELUM_DIBUKA') {
    throw new PresensiError(
      409,
      'BELUM_DIBUKA',
      'Sesi presensi belum dibuka oleh asisten.',
    );
  }

  if (sesi.statusSesi !== 'DIBUKA') {
    throw new PresensiError(
      409,
      'SUDAH_DITUTUP',
      'Sesi presensi sudah ditutup.',
    );
  }

  if (!validasiBuktiQr(payload.buktiQr, sesi.idSesi, sesi.tokenQrAktif)) {
    throw new PresensiError(
      422,
      'QR_TIDAK_VALID',
      'Kode QR tidak valid atau bukan untuk sesi praktikum ini.',
    );
  }

  if (!keanggotaan.exists || keanggotaan.status !== 'AKTIF') {
    throw new PresensiError(
      403,
      'BUKAN_ANGGOTA',
      'Anda bukan anggota aktif pada kelas praktikum ini.',
    );
  }

  if (sudahPresensi) {
    throw new PresensiError(
      409,
      'SUDAH_PRESENSI',
      'Anda sudah tercatat hadir pada sesi ini.',
    );
  }

  if (
    izin &&
    (izin.statusIzin === 'MENUNGGU' || izin.statusIzin === 'DISETUJUI')
  ) {
    throw new PresensiError(
      409,
      'ADA_IZIN',
      'Presensi tidak dapat dilakukan karena pengajuan izin masih menunggu atau sudah disetujui.',
    );
  }

  if (
    !Number.isFinite(payload.akurasi) ||
    payload.akurasi <= 0 ||
    payload.akurasi > BATAS_AKURASI_MAKSIMAL_METER
  ) {
    const pesan =
      payload.akurasi <= 0
        ? 'Akurasi GPS tidak valid. Perbarui lokasi GPS Anda dan coba lagi.'
        : `Akurasi GPS terlalu rendah (±${Math.round(payload.akurasi)} m, maksimal ${BATAS_AKURASI_MAKSIMAL_METER} m). Pastikan berada di area terbuka.`;

    throw new PresensiError(422, 'INPUT_TIDAK_VALID', pesan);
  }

  const selisihWaktuMs = waktuServerMs - payload.timestamp;
  if (
    !Number.isFinite(payload.timestamp) ||
    selisihWaktuMs > BATAS_USIA_TIMESTAMP_MS ||
    selisihWaktuMs < -TOLERANSI_MASA_DEPAN_MS
  ) {
    throw new PresensiError(
      422,
      'INPUT_TIDAK_VALID',
      'Titik lokasi GPS sudah kedaluwarsa. Perbarui lokasi GPS Anda dan coba lagi.',
    );
  }

  if (!lab.exists) {
    throw new PresensiError(
      404,
      'DATA_TIDAK_DITEMUKAN',
      'Data laboratorium untuk sesi ini tidak ditemukan.',
    );
  }

  if (!lab.aktif) {
    throw new PresensiError(
      409,
      'DATA_TIDAK_DITEMUKAN',
      'Lokasi laboratorium untuk sesi ini sedang nonaktif.',
    );
  }

  if (
    !Number.isFinite(lab.latitude) ||
    lab.latitude < -90 ||
    lab.latitude > 90 ||
    !Number.isFinite(lab.longitude) ||
    lab.longitude < -180 ||
    lab.longitude > 180 ||
    !Number.isFinite(lab.radiusPresensi) ||
    lab.radiusPresensi <= 0
  ) {
    throw new PresensiError(
      422,
      'DATA_TIDAK_DITEMUKAN',
      'Konfigurasi koordinat atau radius laboratorium belum valid.',
    );
  }

  const jarakMeter = hitungJarakHaversineMeter(
    payload.koordinat.latitude,
    payload.koordinat.longitude,
    lab.latitude,
    lab.longitude,
  );

  if (jarakMeter > lab.radiusPresensi) {
    throw new PresensiError(
      422,
      'INPUT_TIDAK_VALID',
      `Anda berada di luar area laboratorium (${Math.round(jarakMeter)} m dari titik pusat, batas ${lab.radiusPresensi} m).`,
    );
  }

  return {
    jarakMeter: Math.round(jarakMeter * 10) / 10,
    radiusPresensi: lab.radiusPresensi,
  };
}

export async function prosesPresensi(
  db: Firestore,
  uid: string,
  payload: RecordAttendancePayload,
  waktuServerMs: number = Date.now(),
): Promise<RecordAttendanceResponse> {
  const idPresensi = `${payload.sesiId}_${uid}`;
  const penggunaRef = db.collection('pengguna').doc(uid);
  const sesiRef = db.collection('sesi').doc(payload.sesiId);
  const presensiRef = db.collection('presensi').doc(idPresensi);

  return db.runTransaction(async (tx) => {
    const [penggunaSnap, sesiSnap] = await Promise.all([
      tx.get(penggunaRef),
      tx.get(sesiRef),
    ]);

    const peran =
      penggunaSnap.exists && typeof penggunaSnap.data()?.peran === 'string'
        ? String(penggunaSnap.data()!.peran)
        : null;

    if (peran !== 'PRAKTIKAN') {
      throw new PresensiError(
        403,
        'TIDAK_BERWENANG',
        'Hanya praktikan yang dapat melakukan presensi.',
      );
    }

    if (!sesiSnap.exists) {
      throw new PresensiError(
        404,
        'DATA_TIDAK_DITEMUKAN',
        'Sesi praktikum tidak ditemukan.',
      );
    }

    const sesiData = sesiSnap.data() ?? {};
    const kelasId =
      typeof sesiData.kelasId === 'string' ? sesiData.kelasId.trim() : '';
    const labId =
      typeof sesiData.labId === 'string' ? sesiData.labId.trim() : '';
    const lokasiNama =
      typeof sesiData.lokasi === 'string' ? sesiData.lokasi.trim() : '';

    if (!kelasId || (!labId && !lokasiNama)) {
      throw new PresensiError(
        422,
        'DATA_TIDAK_DITEMUKAN',
        'Konfigurasi kelas atau laboratorium pada sesi belum lengkap.',
      );
    }

    const kelasRef = db.collection('kelas').doc(kelasId);
    const anggotaRef = db.collection('keanggotaan').doc(`${kelasId}_${uid}`);
    const rahasiaQrRef = sesiRef.collection('rahasia').doc('qr');
    const izinRef = db.collection('izin').doc(`${payload.sesiId}_${uid}`);

    const labTargetPromise = labId
      ? tx.get(db.collection('laboratorium').doc(labId))
      : tx.get(
          db
            .collection('laboratorium')
            .where('nama', '==', lokasiNama)
            .limit(1),
        );

    const [
      kelasSnap,
      anggotaSnap,
      presensiSnap,
      rahasiaQrSnap,
      izinSnap,
      labResult,
    ] = await Promise.all([
      tx.get(kelasRef),
      tx.get(anggotaRef),
      tx.get(presensiRef),
      tx.get(rahasiaQrRef),
      tx.get(izinRef),
      labTargetPromise,
    ]);

    let izinData: { statusIzin: string } | null = null;
    if (izinSnap.exists) {
      izinData = { statusIzin: String(izinSnap.data()?.statusIzin ?? '') };
    } else {
      const izinQuerySnap = await tx.get(
        db
          .collection('izin')
          .where('sesiId', '==', payload.sesiId)
          .where('uid', '==', uid)
          .limit(1),
      );
      if (!izinQuerySnap.empty) {
        izinData = {
          statusIzin: String(izinQuerySnap.docs[0].data()?.statusIzin ?? ''),
        };
      }
    }

    const labDoc =
      'exists' in labResult
        ? labResult.exists
          ? labResult
          : null
        : !labResult.empty
          ? labResult.docs[0]
          : null;
    const labRaw = labDoc?.data();

    const rahasiaData = rahasiaQrSnap.exists ? rahasiaQrSnap.data() : undefined;
    const tokenQrAktif =
      typeof rahasiaData?.kodeQr === 'string'
        ? rahasiaData.kodeQr
        : typeof rahasiaData?.tokenQrAktif === 'string'
          ? rahasiaData.tokenQrAktif
          : typeof sesiData.tokenQrAktif === 'string'
            ? sesiData.tokenQrAktif
            : null;

    const hasilEvaluasi = evaluasiKelayakanPresensi({
      peran,
      sesi: {
        idSesi: payload.sesiId,
        kelasId,
        statusSesi: String(sesiData.statusSesi ?? ''),
        diarsipkan: sesiData.diarsipkan === true,
        tokenQrAktif,
      },
      kelas: {
        exists: kelasSnap.exists,
        diarsipkan: kelasSnap.data()?.diarsipkan === true,
      },
      keanggotaan: {
        exists: anggotaSnap.exists,
        status: String(anggotaSnap.data()?.status ?? ''),
      },
      sudahPresensi: presensiSnap.exists,
      izin: izinData,
      lab: {
        exists: Boolean(labDoc && labRaw),
        aktif: labRaw?.aktif !== false,
        latitude:
          typeof labRaw?.latitude === 'number' ? labRaw.latitude : Number.NaN,
        longitude:
          typeof labRaw?.longitude === 'number' ? labRaw.longitude : Number.NaN,
        radiusPresensi:
          typeof labRaw?.radiusPresensi === 'number'
            ? labRaw.radiusPresensi
            : Number.NaN,
      },
      payload,
      waktuServerMs,
    });

    tx.set(presensiRef, {
      idPresensi,
      sesiId: payload.sesiId,
      kelasId,
      uid,
      waktuHadir: Timestamp.fromMillis(waktuServerMs),
      jarakMeter: hasilEvaluasi.jarakMeter,
    });

    return {
      idPresensi,
      sesiId: payload.sesiId,
      kelasId,
      uid,
      jarakMeter: hasilEvaluasi.jarakMeter,
      radiusPresensi: hasilEvaluasi.radiusPresensi,
      waktuHadirIso: new Date(waktuServerMs).toISOString(),
    };
  });
}

function petakanErrorServer(error: unknown): {
  status: number;
  alasan: AlasanGagalPresensi;
  pesan: string;
} {
  if (error instanceof PresensiError) {
    return {
      status: error.status,
      alasan: error.alasan,
      pesan: error.message,
    };
  }

  if (adalahObjek(error)) {
    const kode = String(error.code ?? '').toLowerCase();
    const pesan =
      typeof error.message === 'string' ? error.message.toLowerCase() : '';
    if (
      kode.includes('unavailable') ||
      kode.includes('deadline-exceeded') ||
      pesan.includes('unavailable') ||
      pesan.includes('deadline')
    ) {
      return {
        status: 503,
        alasan: 'JARINGAN',
        pesan: 'Layanan database belum dapat dijangkau. Silakan coba lagi.',
      };
    }
  }

  return {
    status: 500,
    alasan: 'TIDAK_DIKENAL',
    pesan: 'Terjadi kesalahan pada server saat mencatat presensi.',
  };
}

export function buatHandlerPresensi(
  dependensi: DependensiPresensi,
): (request: Request) => Promise<Response> {
  return async (request) => {
    if (request.method === 'GET') {
      return respons(
        200,
        { ok: true, data: { layanan: 'presensi', aktif: true } },
        { 'Cache-Control': 'no-store' },
      );
    }

    if (request.method !== 'POST') {
      return respons(
        405,
        {
          ok: false,
          alasan: 'INPUT_TIDAK_VALID',
          pesan: 'Gunakan metode GET atau POST.',
        },
        { Allow: 'GET, POST' },
      );
    }

    const token = tokenDariHeader(request.headers.get('authorization'));
    if (!token) {
      return respons(401, {
        ok: false,
        alasan: 'AUTENTIKASI_GAGAL',
        pesan: 'Firebase ID token diperlukan.',
      });
    }

    let isi: unknown;
    try {
      isi = await request.json();
    } catch {
      return respons(400, {
        ok: false,
        alasan: 'INPUT_TIDAK_VALID',
        pesan: 'Body harus berupa JSON yang valid.',
      });
    }

    const payload = bacaPayloadPresensi(isi);
    if (!payload) {
      return respons(400, {
        ok: false,
        alasan: 'INPUT_TIDAK_VALID',
        pesan: 'Data presensi, koordinat, atau timestamp tidak valid.',
      });
    }

    let uid: string;
    try {
      const verified = await dependensi.verifikasiToken(token);
      uid = typeof verified?.uid === 'string' ? verified.uid.trim() : '';
      if (!uid) {
        return respons(401, {
          ok: false,
          alasan: 'AUTENTIKASI_GAGAL',
          pesan: 'Firebase ID token tidak valid.',
        });
      }
    } catch {
      return respons(401, {
        ok: false,
        alasan: 'AUTENTIKASI_GAGAL',
        pesan: 'Firebase ID token tidak valid atau kedaluwarsa.',
      });
    }

    try {
      const hasil = await dependensi.catatPresensi(uid, payload);
      return respons(200, { ok: true, data: hasil });
    } catch (error) {
      const mapped = petakanErrorServer(error);
      return respons(mapped.status, {
        ok: false,
        alasan: mapped.alasan,
        pesan: mapped.pesan,
      });
    }
  };
}

function buatHandlerProduksi(): (request: Request) => Promise<Response> {
  const app = firebaseAdminApp('hadirin-presensi-proxy');

  const auth = getAuth(app);
  const db = getFirestore(app);

  return buatHandlerPresensi({
    verifikasiToken: async (token) => {
      const decoded = await auth.verifyIdToken(token);
      return { uid: decoded.uid };
    },
    catatPresensi: (uid, payload) => prosesPresensi(db, uid, payload),
  });
}

let handlerProduksi: ((request: Request) => Promise<Response>) | null = null;

export default {
  async fetch(request: Request): Promise<Response> {
    try {
      handlerProduksi ??= buatHandlerProduksi();
      return await handlerProduksi(request);
    } catch {
      return respons(503, {
        ok: false,
        alasan: 'JARINGAN',
        pesan: 'Layanan presensi belum dikonfigurasi dengan benar.',
      });
    }
  },
};
