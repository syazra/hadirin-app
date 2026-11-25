import * as admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

if (!admin.apps.length) {
  admin.initializeApp();
}

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
  ok: true;
  idPresensi: string;
  jarakMeter: number;
  radiusPresensi: number;
  waktuHadirIso: string;
}

export const BATAS_AKURASI_MAKSIMAL_METER = 50;
export const BATAS_USIA_TIMESTAMP_MS = 60_000;
export const TOLERANSI_MASA_DEPAN_MS = 15_000;

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
 * Memvalidasi kecocokan bukti QR dari klien terhadap sesiId & tokenQrAktif di Firestore.
 * Mendukung format `hadirin:<idSesi>:<kodeQr>`, deep link, JSON, maupun string token mentah.
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

  // 4. Format Token Mentah
  return bukti === tokenAktif;
}

export interface EvaluasiPresensiInput {
  sesi: {
    idSesi: string;
    kelasId: string;
    statusSesi: string;
    diarsipkan?: boolean;
    tokenQrAktif?: string | null;
  };
  lab: {
    latitude: number;
    longitude: number;
    radiusPresensi: number;
    aktif?: boolean;
  };
  keanggotaan: {
    status: string;
  } | null;
  izin: {
    statusIzin: string;
  } | null;
  sudahPresensi: boolean;
  payload: RecordAttendancePayload;
  waktuServerMs: number;
}

/**
 * Fungsi murni untuk mengevaluasi seluruh aturan bisnis presensi di server.
 * Melempar HttpsError dengan alasan terstruktur jika tidak memenuhi syarat.
 */
export function evaluasiKelayakanPresensi(
  input: EvaluasiPresensiInput,
): { jarakMeter: number; radiusPresensi: number } {
  const { sesi, lab, keanggotaan, izin, sudahPresensi, payload, waktuServerMs } =
    input;

  if (sesi.diarsipkan) {
    throw new HttpsError(
      'failed-precondition',
      'Sesi praktikum ini sudah diarsipkan.',
      { alasan: 'DATA_DIARSIPKAN' },
    );
  }

  if (sesi.statusSesi === 'BELUM_DIBUKA') {
    throw new HttpsError(
      'failed-precondition',
      'Sesi presensi belum dibuka oleh asisten.',
      { alasan: 'BELUM_DIBUKA' },
    );
  }

  if (sesi.statusSesi !== 'DIBUKA') {
    throw new HttpsError(
      'failed-precondition',
      'Sesi presensi sudah ditutup.',
      { alasan: 'SUDAH_DITUTUP' },
    );
  }

  if (!validasiBuktiQr(payload.buktiQr, sesi.idSesi, sesi.tokenQrAktif)) {
    throw new HttpsError(
      'invalid-argument',
      'Kode QR tidak valid atau sudah kedaluwarsa.',
      { alasan: 'QR_TIDAK_VALID' },
    );
  }

  if (!keanggotaan || keanggotaan.status !== 'AKTIF') {
    throw new HttpsError(
      'permission-denied',
      'Anda bukan anggota aktif pada kelas praktikum ini.',
      { alasan: 'BUKAN_ANGGOTA' },
    );
  }

  if (sudahPresensi) {
    throw new HttpsError(
      'already-exists',
      'Anda sudah tercatat hadir pada sesi ini.',
      { alasan: 'SUDAH_PRESENSI' },
    );
  }

  if (
    izin &&
    (izin.statusIzin === 'DISETUJUI' || izin.statusIzin === 'MENUNGGU')
  ) {
    throw new HttpsError(
      'failed-precondition',
      'Presensi tidak dapat dilakukan karena pengajuan izin masih menunggu atau sudah disetujui.',
      { alasan: 'ADA_IZIN' },
    );
  }

  if (
    !Number.isFinite(payload.akurasi) ||
    payload.akurasi <= 0 ||
    payload.akurasi > BATAS_AKURASI_MAKSIMAL_METER
  ) {
    throw new HttpsError(
      'failed-precondition',
      `Akurasi GPS terlalu rendah (${Math.round(payload.akurasi)} m). Pastikan berada di area terbuka.`,
      { alasan: 'INPUT_TIDAK_VALID' },
    );
  }

  const selisihWaktuMs = waktuServerMs - payload.timestamp;
  if (
    !Number.isFinite(payload.timestamp) ||
    selisihWaktuMs > BATAS_USIA_TIMESTAMP_MS ||
    selisihWaktuMs < -TOLERANSI_MASA_DEPAN_MS
  ) {
    throw new HttpsError(
      'failed-precondition',
      'Titik lokasi sudah kedaluwarsa. Perbarui lokasi GPS Anda dan coba lagi.',
      { alasan: 'TIMEOUT' },
    );
  }

  if (lab.aktif === false) {
    throw new HttpsError(
      'failed-precondition',
      'Lokasi laboratorium untuk sesi ini sedang nonaktif.',
      { alasan: 'DATA_TIDAK_DITEMUKAN' },
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
    throw new HttpsError(
      'failed-precondition',
      'Konfigurasi koordinat atau radius laboratorium belum valid.',
      { alasan: 'DATA_TIDAK_DITEMUKAN' },
    );
  }

  const jarakMeter = hitungJarakHaversineMeter(
    payload.koordinat.latitude,
    payload.koordinat.longitude,
    lab.latitude,
    lab.longitude,
  );

  if (jarakMeter > lab.radiusPresensi) {
    throw new HttpsError(
      'failed-precondition',
      `Anda berada di luar area laboratorium (${Math.round(jarakMeter)} m dari titik pusat, batas ${lab.radiusPresensi} m).`,
      {
        alasan: 'INPUT_TIDAK_VALID',
        jarakMeter: Math.round(jarakMeter),
        radiusPresensi: lab.radiusPresensi,
      },
    );
  }

  return {
    jarakMeter: Math.round(jarakMeter * 10) / 10,
    radiusPresensi: lab.radiusPresensi,
  };
}

function validasiPayloadDasar(data: unknown): RecordAttendancePayload {
  if (!data || typeof data !== 'object') {
    throw new HttpsError('invalid-argument', 'Payload presensi tidak valid.', {
      alasan: 'INPUT_TIDAK_VALID',
    });
  }

  const raw = data as Record<string, unknown>;
  const sesiId = typeof raw.sesiId === 'string' ? raw.sesiId.trim() : '';
  const buktiQr = typeof raw.buktiQr === 'string' ? raw.buktiQr.trim() : '';
  const koordinat = raw.koordinat as Record<string, unknown> | undefined;
  const latitude =
    koordinat && typeof koordinat.latitude === 'number'
      ? koordinat.latitude
      : Number.NaN;
  const longitude =
    koordinat && typeof koordinat.longitude === 'number'
      ? koordinat.longitude
      : Number.NaN;
  const akurasi =
    typeof raw.akurasi === 'number' ? raw.akurasi : Number.NaN;
  const timestamp =
    typeof raw.timestamp === 'number' ? raw.timestamp : Number.NaN;

  if (
    !sesiId ||
    !buktiQr ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180 ||
    !Number.isFinite(akurasi) ||
    !Number.isFinite(timestamp)
  ) {
    throw new HttpsError(
      'invalid-argument',
      'Data koordinat, QR, atau timestamp tidak lengkap.',
      { alasan: 'INPUT_TIDAK_VALID' },
    );
  }

  return {
    sesiId,
    buktiQr,
    koordinat: { latitude, longitude },
    akurasi,
    timestamp,
  };
}

export async function prosesRecordAttendance(
  db: admin.firestore.Firestore,
  uid: string,
  rawPayload: unknown,
  waktuServerMs: number = Date.now(),
): Promise<RecordAttendanceResponse> {
  const payload = validasiPayloadDasar(rawPayload);
  const idPresensi = `${payload.sesiId}_${uid}`;

  const sesiRef = db.collection('sesi').doc(payload.sesiId);
  const presensiRef = db.collection('presensi').doc(idPresensi);

  return db.runTransaction(async (tx) => {
    const sesiSnap = await tx.get(sesiRef);
    if (!sesiSnap.exists) {
      throw new HttpsError(
        'not-found',
        'Sesi praktikum tidak ditemukan.',
        { alasan: 'DATA_TIDAK_DITEMUKAN' },
      );
    }

    const sesiData = sesiSnap.data()!;
    const kelasId = String(sesiData.kelasId ?? '');
    const labId = typeof sesiData.labId === 'string' ? sesiData.labId.trim() : '';
    const lokasiNama =
      typeof sesiData.lokasi === 'string' ? sesiData.lokasi.trim() : '';

    if (!kelasId || (!labId && !lokasiNama)) {
      throw new HttpsError(
        'failed-precondition',
        'Konfigurasi kelas atau laboratorium pada sesi belum lengkap.',
        { alasan: 'DATA_TIDAK_DITEMUKAN' },
      );
    }

    const anggotaRef = db.collection('keanggotaan').doc(`${kelasId}_${uid}`);
    const rahasiaQrRef = sesiRef.collection('rahasia').doc('qr');
    const izinQuery = db
      .collection('izin')
      .where('sesiId', '==', payload.sesiId)
      .where('uid', '==', uid)
      .limit(1);

    const labTargetPromise = labId
      ? tx.get(db.collection('laboratorium').doc(labId))
      : tx.get(
          db
            .collection('laboratorium')
            .where('nama', '==', lokasiNama)
            .limit(1),
        );

    const [labResult, anggotaSnap, presensiSnap, izinSnap, rahasiaQrSnap] =
      await Promise.all([
        labTargetPromise,
        tx.get(anggotaRef),
        tx.get(presensiRef),
        tx.get(izinQuery),
        tx.get(rahasiaQrRef),
      ]);

    const labDoc =
      'exists' in labResult
        ? labResult.exists
          ? labResult
          : null
        : !labResult.empty
          ? labResult.docs[0]
          : null;

    if (!labDoc) {
      throw new HttpsError(
        'not-found',
        'Data laboratorium tidak ditemukan.',
        { alasan: 'DATA_TIDAK_DITEMUKAN' },
      );
    }

    const labData = labDoc.data()!;
    const rahasiaData = rahasiaQrSnap.exists ? rahasiaQrSnap.data() : undefined;
    const tokenQrAktif =
      typeof rahasiaData?.kodeQr === 'string'
        ? rahasiaData.kodeQr
        : typeof rahasiaData?.tokenQrAktif === 'string'
          ? rahasiaData.tokenQrAktif
          : typeof sesiData.tokenQrAktif === 'string'
            ? sesiData.tokenQrAktif
            : null;

    const anggotaData = anggotaSnap.exists
      ? { status: String(anggotaSnap.data()!.status ?? '') }
      : null;
    const izinData = !izinSnap.empty
      ? { statusIzin: String(izinSnap.docs[0].data().statusIzin ?? '') }
      : null;

    const hasilEvaluasi = evaluasiKelayakanPresensi({
      sesi: {
        idSesi: payload.sesiId,
        kelasId,
        statusSesi: String(sesiData.statusSesi ?? ''),
        diarsipkan: Boolean(sesiData.diarsipkan),
        tokenQrAktif,
      },
      lab: {
        latitude:
          typeof labData.latitude === 'number' ? labData.latitude : Number.NaN,
        longitude:
          typeof labData.longitude === 'number'
            ? labData.longitude
            : Number.NaN,
        radiusPresensi:
          typeof labData.radiusPresensi === 'number'
            ? labData.radiusPresensi
            : Number.NaN,
        aktif: labData.aktif !== false,
      },
      keanggotaan: anggotaData,
      izin: izinData,
      sudahPresensi: presensiSnap.exists,
      payload,
      waktuServerMs,
    });

    const waktuHadir = admin.firestore.Timestamp.fromMillis(waktuServerMs);

    tx.set(presensiRef, {
      idPresensi,
      sesiId: payload.sesiId,
      kelasId,
      uid,
      waktuHadir,
      jarakMeter: hasilEvaluasi.jarakMeter,
    });

    return {
      ok: true,
      idPresensi,
      jarakMeter: hasilEvaluasi.jarakMeter,
      radiusPresensi: hasilEvaluasi.radiusPresensi,
      waktuHadirIso: new Date(waktuServerMs).toISOString(),
    };
  });
}

export const recordAttendance = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError(
      'unauthenticated',
      'Anda harus login untuk melakukan presensi.',
      { alasan: 'AUTENTIKASI_GAGAL' },
    );
  }

  const db = admin.firestore();
  return prosesRecordAttendance(db, request.auth.uid, request.data);
});