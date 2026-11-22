import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { existingDomainEvent } from './domain-sender';
import { sendToUsers, type EnqueueResult } from './send-notification';
import { normalizeNotification, type NotificationInput } from './notification-contract';

export interface IzinDecisionInput {
  eventId: string;
  izinId: string;
  beforeData: Record<string, unknown> | undefined;
  afterData: Record<string, unknown> | undefined;
}

export function decisionNotification(input: IzinDecisionInput): NotificationInput | null {
  const { beforeData: before, afterData: after } = input;
  if (!before || !after || before.statusIzin !== 'MENUNGGU'
    || !['DISETUJUI', 'DITOLAK'].includes(String(after.statusIzin))
    || typeof after.uid !== 'string' || !after.uid.trim()
    || before.uid !== after.uid || before.sesiId !== after.sesiId
    || before.kelasId !== after.kelasId) return null;
  const approved = after.statusIzin === 'DISETUJUI';
  const message: NotificationInput = {
    eventId: `izin-decision:${input.eventId}`, entityId: input.izinId, routeKey: 'IZIN',
    type: approved ? 'IZIN_DISETUJUI' : 'IZIN_DITOLAK', recipientUids: [after.uid],
    title: approved ? 'Pengajuan izin disetujui' : 'Pengajuan izin ditolak',
    body: 'Buka Hadir.in untuk melihat hasil pengajuan izin Anda.',
  };
  try { return normalizeNotification(message); } catch { return null; }
}

export async function processIzinDecision(db: Firestore, input: IzinDecisionInput,
  sender: (input: NotificationInput) => Promise<EnqueueResult> = sendToUsers): Promise<EnqueueResult | null> {
  const message = decisionNotification(input);
  if (!message) return null;
  const existing = await existingDomainEvent(db, message.eventId);
  if (existing) return existing;
  const profile = await db.collection('pengguna').doc(message.recipientUids[0]).get();
  if (!profile.exists || profile.get('peran') !== 'PRAKTIKAN') return null;
  return sender(message);
}

export const onIzinDecision = onDocumentUpdated({ document: 'izin/{izinId}',
  region: 'asia-southeast2', retry: true, timeoutSeconds: 60, maxInstances: 3 }, async event => {
  if (!event.data) return;
  if (!getApps().length) initializeApp();
  try {
    await processIzinDecision(getFirestore(), { eventId: event.id, izinId: event.params.izinId,
      beforeData: event.data.before.data(), afterData: event.data.after.data() });
  } catch {
    throw new Error('Izin notification enqueue requires retry');
  }
});
