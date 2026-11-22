import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { sendToUsers, type EnqueueResult } from './send-notification';
import { existingDomainEvent } from './domain-sender';

if (!admin.apps.length) {
  admin.initializeApp();
}

const FIELD_JADWAL = [
  'judul',
  'waktuMulai',
  'waktuSelesai',
  'labId',
] as const;

type FieldJadwal = (typeof FIELD_JADWAL)[number];

export interface PayloadNotifikasiJadwalDiperbarui {
  idempotencyKey: string;
  eventType: 'JADWAL_BERUBAH';
  sesiId: string;
  kelasId: string;
  recipientUids: string[];
  title: string;
  body: string;
  data: {
    type: 'JADWAL_BERUBAH';
    sesiId: string;
    kelasId: string;
    route: string;
  };
}

export type ScheduleNotificationSender = (
  payload: PayloadNotifikasiJadwalDiperbarui,
) => Promise<EnqueueResult | void>;

async function kirimViaSharedSender(
  payload: PayloadNotifikasiJadwalDiperbarui,
): Promise<EnqueueResult> {
  return sendToUsers({
    eventId: payload.idempotencyKey, type: 'JADWAL_BERUBAH', entityId: payload.sesiId,
    routeKey: 'SESI', recipientUids: payload.recipientUids,
    title: 'Jadwal praktikum diperbarui', body: 'Buka Hadir.in untuk melihat jadwal terbaru.',
  });
}

export interface EvaluasiPerubahanJadwalInput {
  sesiId: string;
  eventId: string;
  beforeData: Record<string, unknown> | undefined;
  afterData: Record<string, unknown> | undefined;
}

function nilaiFieldSama(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;

  if (
    typeof a === 'object' &&
    typeof b === 'object' &&
    'toMillis' in a &&
    'toMillis' in b &&
    typeof a.toMillis === 'function' &&
    typeof b.toMillis === 'function'
  ) {
    return a.toMillis() === b.toMillis();
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  return false;
}

export function cekPerubahanJadwalSesi(
  input: EvaluasiPerubahanJadwalInput,
): {
  sesiId: string;
  kelasId: string;
  judulSesi: string;
  fieldBerubah: FieldJadwal[];
} | null {
  const { sesiId, beforeData, afterData } = input;

  if (!beforeData || !afterData || afterData.diarsipkan === true) {
    return null;
  }

  const fieldBerubah = FIELD_JADWAL.filter(
    (field) => !nilaiFieldSama(beforeData[field], afterData[field]),
  );

  if (fieldBerubah.length === 0) {
    return null;
  }

  const kelasId =
    typeof afterData.kelasId === 'string' ? afterData.kelasId.trim() : '';

  if (!kelasId) return null;

  const judulSesi =
    typeof afterData.judul === 'string' && afterData.judul.trim()
      ? afterData.judul.trim()
      : 'Sesi Praktikum';

  return {
    sesiId,
    kelasId,
    judulSesi,
    fieldBerubah,
  };
}

export async function prosesNotifikasiJadwalDiperbarui(
  db: admin.firestore.Firestore,
  input: EvaluasiPerubahanJadwalInput,
  sender: ScheduleNotificationSender = kirimViaSharedSender,
): Promise<{
  dikirim: boolean;
  jumlahPenerima: number;
  idempotencyKey?: string;
  status?: EnqueueResult['status'];
}> {
  const perubahan = cekPerubahanJadwalSesi(input);

  if (!perubahan) {
    return { dikirim: false, jumlahPenerima: 0 };
  }

  const { sesiId, kelasId, judulSesi, fieldBerubah } = perubahan;
  const idempotencyKey = `schedule-updated:${sesiId}:${input.eventId}`;
  if (sender === kirimViaSharedSender) {
    const existing = await existingDomainEvent(db, idempotencyKey);
    if (existing) return { dikirim: false, jumlahPenerima: 0, idempotencyKey, status: existing.status };
  }

  const [kelasSnap, anggotaSnap] = await Promise.all([
    db.collection('kelas').doc(kelasId).get(),
    db
      .collection('keanggotaan')
      .where('kelasId', '==', kelasId)
      .where('status', '==', 'AKTIF')
      .get(),
  ]);

  if (!kelasSnap.exists || kelasSnap.data()?.diarsipkan === true) {
    logger.info('Notifikasi jadwal dilewati: kelas tidak ditemukan atau diarsipkan.', {
      sesiId,
      kelasId,
    });
    return { dikirim: false, jumlahPenerima: 0 };
  }

  const kelasData = kelasSnap.data() ?? {};
  const asistenUid =
    typeof kelasData.asistenUid === 'string' ? kelasData.asistenUid : '';

  const recipientSet = new Set<string>();

  for (const docSnap of anggotaSnap.docs) {
    const uid = docSnap.data()?.uid;

    if (
      typeof uid === 'string' &&
      uid.trim().length > 0 &&
      uid.trim() !== asistenUid
    ) {
      recipientSet.add(uid.trim());
    }
  }

  const recipientUids = Array.from(recipientSet);

  if (recipientUids.length === 0) {
    logger.info('Tidak ada anggota aktif untuk notifikasi perubahan jadwal.', {
      sesiId,
      kelasId,
    });
    return { dikirim: false, jumlahPenerima: 0 };
  }

  const result = await sender({
    idempotencyKey,
    eventType: 'JADWAL_BERUBAH',
    sesiId,
    kelasId,
    recipientUids,
    title: 'Jadwal Praktikum Diperbarui',
    body: `Jadwal "${judulSesi}" telah diperbarui. Silakan periksa jadwal terbaru.`,
    data: {
      type: 'JADWAL_BERUBAH',
      sesiId,
      kelasId,
      route: `/sesi/${sesiId}`,
    },
  });

  logger.info('Notifikasi perubahan jadwal diproses.', {
    sesiId,
    kelasId,
    fieldBerubah,
    jumlahPenerima: recipientUids.length,
    idempotencyKey,
  });

  return {
    dikirim: result ? result.status === 'QUEUED' : true,
    status: result?.status,
    jumlahPenerima: recipientUids.length,
    idempotencyKey,
  };
}

export const onScheduleUpdated = onDocumentUpdated(
  { document: 'sesi/{sesiId}', region: 'asia-southeast2', retry: true, timeoutSeconds: 60, maxInstances: 3 },
  async (event) => {
    if (!event.data) return;

    try {
      await prosesNotifikasiJadwalDiperbarui(
        admin.firestore(),
        {
          sesiId: event.params.sesiId,
          eventId: event.id,
          beforeData: event.data.before.data(),
          afterData: event.data.after.data(),
        },
      );
    } catch {
      throw new Error('Schedule notification enqueue requires retry');
    }
  },
);
