import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';

if (!admin.apps.length) {
  admin.initializeApp();
}

export interface PayloadNotifikasiSesiDibuka {
  idempotencyKey: string;
  eventType: 'SESI_DIBUKA';
  sesiId: string;
  kelasId: string;
  recipientUids: string[];
  title: string;
  body: string;
  data: {
    type: 'SESI_DIBUKA';
    sesiId: string;
    kelasId: string;
    route: string;
  };
}

export type SharedNotificationSender = (
  payload: PayloadNotifikasiSesiDibuka,
) => Promise<void>;

/**
 * Adapter sementara ke shared sender helper milik Farhan.
 * Saat helper Farhan sudah masuk di `functions/src/notifications/`,
 * ganti isi fungsi ini (atau injeksikan langsung) ke helper Farhan.
 */
async function kirimViaSharedSender(
  payload: PayloadNotifikasiSesiDibuka,
): Promise<void> {
  // TODO(Farhan): Hubungkan ke shared notification sender helper
  // Contoh: await sendNotificationToUsers(payload);
  logger.info('Mengirim notifikasi sesi dibuka ke shared sender', {
    idempotencyKey: payload.idempotencyKey,
    sesiId: payload.sesiId,
    kelasId: payload.kelasId,
    jumlahPenerima: payload.recipientUids.length,
  });
}

export interface EvaluasiPerubahanSesiInput {
  sesiId: string;
  beforeData: Record<string, unknown> | undefined;
  afterData: Record<string, unknown> | undefined;
}

/**
 * Mengecek apakah dokumen sesi mengalami transisi status valid:
 * dari `BELUM_DIBUKA` menjadi `DIBUKA` dan tidak diarsipkan.
 */
export function cekTransisiSesiDibuka(
  input: EvaluasiPerubahanSesiInput,
): { sesiId: string; kelasId: string; judulSesi: string; lokasi: string } | null {
  const { sesiId, beforeData, afterData } = input;
  if (!beforeData || !afterData) {
    return null;
  }

  const statusSebelum = String(beforeData.statusSesi ?? '');
  const statusSesudah = String(afterData.statusSesi ?? '');

  if (statusSebelum !== 'BELUM_DIBUKA' || statusSesudah !== 'DIBUKA') {
    return null;
  }

  if (afterData.diarsipkan === true) {
    return null;
  }

  const kelasId =
    typeof afterData.kelasId === 'string' ? afterData.kelasId.trim() : '';
  if (!kelasId) {
    return null;
  }

  const judulSesi =
    typeof afterData.judul === 'string' && afterData.judul.trim().length > 0
      ? afterData.judul.trim()
      : 'Sesi Praktikum';
  const lokasi =
    typeof afterData.lokasi === 'string' ? afterData.lokasi.trim() : '';

  return {
    sesiId,
    kelasId,
    judulSesi,
    lokasi,
  };
}

/**
 * Fungsi inti pemrosesan trigger notifikasi sesi dibuka.
 * Dipisahkan agar mudah diuji unit test tanpa emulator Firestore.
 */
export async function prosesNotifikasiSesiDibuka(
  db: admin.firestore.Firestore,
  input: EvaluasiPerubahanSesiInput,
  sender: SharedNotificationSender = kirimViaSharedSender,
): Promise<{ dikirim: boolean; jumlahPenerima: number; idempotencyKey?: string }> {
  const transisi = cekTransisiSesiDibuka(input);
  if (!transisi) {
    return { dikirim: false, jumlahPenerima: 0 };
  }

  const { sesiId, kelasId, judulSesi, lokasi } = transisi;

  const [kelasSnap, anggotaSnap] = await Promise.all([
    db.collection('kelas').doc(kelasId).get(),
    db
      .collection('keanggotaan')
      .where('kelasId', '==', kelasId)
      .where('status', '==', 'AKTIF')
      .get(),
  ]);

  if (!kelasSnap.exists || kelasSnap.data()?.diarsipkan === true) {
    logger.info('Notifikasi sesi dibuka dilewati: kelas tidak ditemukan atau diarsipkan.', {
      sesiId,
      kelasId,
    });
    return { dikirim: false, jumlahPenerima: 0 };
  }

  const namaPraktikum =
    typeof kelasSnap.data()?.namaPraktikum === 'string' &&
    kelasSnap.data()!.namaPraktikum.trim().length > 0
      ? kelasSnap.data()!.namaPraktikum.trim()
      : 'Praktikum';

  const asistenUid =
    typeof kelasSnap.data()?.asistenUid === 'string'
      ? kelasSnap.data()!.asistenUid
      : '';

  const recipientSet = new Set<string>();
  for (const docSnap of anggotaSnap.docs) {
    const uid = docSnap.data()?.uid;
    if (typeof uid === 'string' && uid.trim().length > 0 && uid !== asistenUid) {
      recipientSet.add(uid.trim());
    }
  }

  const recipientUids = Array.from(recipientSet);
  if (recipientUids.length === 0) {
    logger.info('Tidak ada praktikan aktif untuk dikirimi notifikasi sesi dibuka.', {
      sesiId,
      kelasId,
    });
    return { dikirim: false, jumlahPenerima: 0 };
  }

  const idempotencyKey = `session-opened:${sesiId}`;
  const infoLokasi = lokasi ? ` di ${lokasi}` : '';

  await sender({
    idempotencyKey,
    eventType: 'SESI_DIBUKA',
    sesiId,
    kelasId,
    recipientUids,
    title: `Presensi Dibuka • ${namaPraktikum}`,
    body: `${judulSesi}${infoLokasi} telah dibuka. Segera lakukan scan QR presensi.`,
    data: {
      type: 'SESI_DIBUKA',
      sesiId,
      kelasId,
      route: `/sesi/${sesiId}`,
    },
  });

  return {
    dikirim: true,
    jumlahPenerima: recipientUids.length,
    idempotencyKey,
  };
}

/**
 * Cloud Function Firestore Trigger:
 * Berjalan saat dokumen pada koleksi `sesi/{sesiId}` diperbarui,
 * dan hanya mengirim notifikasi ketika statusSesi berubah dari `BELUM_DIBUKA` -> `DIBUKA`.
 *
 * Export handler name untuk digabungkan oleh Farhan ke `functions/src/index.ts`:
 * `onSessionOpened`
 */
export const onSessionOpened = onDocumentUpdated(
  'sesi/{sesiId}',
  async (event) => {
    if (!event.data) {
      return;
    }

    const db = admin.firestore();
    await prosesNotifikasiSesiDibuka(db, {
      sesiId: event.params.sesiId,
      beforeData: event.data.before.data(),
      afterData: event.data.after.data(),
    });
  },
);