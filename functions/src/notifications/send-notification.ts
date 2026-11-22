import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { EVENT_COLLECTION, hash, normalizeNotification, type NotificationInput } from './notification-contract';

export type EnqueueResult = { status: 'QUEUED' | 'ALREADY_QUEUED' | 'NO_RECIPIENTS'; eventKey: string };

/** Server-only enqueue. A successful result does not mean FCM/device delivery. */
export async function enqueueNotification(db: Firestore, raw: NotificationInput): Promise<EnqueueResult> {
  const input = normalizeNotification(raw);
  const eventKey = hash(input.eventId);
  if (!input.recipientUids.length) return { status: 'NO_RECIPIENTS', eventKey };
  const fingerprint = hash(JSON.stringify(input));
  const ref = db.collection(EVENT_COLLECTION).doc(eventKey);
  return db.runTransaction(async tx => {
    const existing = await tx.get(ref);
    if (existing.exists) {
      if (existing.get('fingerprint') !== fingerprint) throw new Error('Notification event ID conflict');
      return { status: 'ALREADY_QUEUED', eventKey };
    }
    tx.create(ref, { input, fingerprint, state: 'QUEUED', attempts: 0, createdAt: Timestamp.now() });
    return { status: 'QUEUED', eventKey };
  });
}

export async function sendToUsers(input: NotificationInput): Promise<EnqueueResult> {
  if (!getApps().length) initializeApp();
  return enqueueNotification(getFirestore(), input);
}
