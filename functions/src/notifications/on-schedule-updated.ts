import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';

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
  eventType: 'JADWAL_SESI_DIPERBARUI';
  sesiId: string;
  kelasId: string;
  recipientUids: string[];
  title: string;
  body: string;
  data: {
    type: 'JADWAL_SESI_DIPERBARUI';
    sesiId: string;
    kelasId: string;
    route: string;
  };
}

export type ScheduleNotificationSender = (
  payload: PayloadNotifikasiJadwalDiperbarui,
) => Promise<void>;

async function kirimViaSharedSender(
  payload: PayloadNotifikasiJadwalDiperbarui,
): Promise<void> {
  // TODO: Sambungkan ke shared notification sender milik Farhan.
  logger.info('Payload notifikasi jadwal sesi siap dikirim', {
    idempotencyKey: payload.idempotencyKey,
    sesiId: payload.sesiId,
    kelasId: payload.kelasId,
    jumlahPenerima: payload.recipientUids.length,
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
}> {
  const perubahan = cekPerubahanJadwalSesi(input);

  if (!perubahan) {
    return { dikirim: false, jumlahPenerima: 0 };
  }

  const { sesiId, kelasId, judulSesi, fieldBerubah } = perubahan;

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

  const idempotencyKey = `schedule-updated:${sesiId}:${input.eventId}`;

  await sender({
    idempotencyKey,
    eventType: 'JADWAL_SESI_DIPERBARUI',
    sesiId,
    kelasId,
    recipientUids,
    title: 'Jadwal Praktikum Diperbarui',
    body: `Jadwal "${judulSesi}" telah diperbarui. Silakan periksa jadwal terbaru.`,
    data: {
      type: 'JADWAL_SESI_DIPERBARUI',
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
    dikirim: true,
    jumlahPenerima: recipientUids.length,
    idempotencyKey,
  };
}

export const onScheduleUpdated = onDocumentUpdated(
  'sesi/{sesiId}',
  async (event) => {
    if (!event.data) return;

    await prosesNotifikasiJadwalDiperbarui(
      admin.firestore(),
      {
        sesiId: event.params.sesiId,
        eventId: event.id,
        beforeData: event.data.before.data(),
        afterData: event.data.after.data(),
      },
    );
  },
);