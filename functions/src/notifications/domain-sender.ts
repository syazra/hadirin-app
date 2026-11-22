import type { Firestore } from 'firebase-admin/firestore';
import { EVENT_COLLECTION, hash } from './notification-contract';
import type { EnqueueResult } from './send-notification';

/** Freeze the first queued audience/content across retries and membership edits. */
export async function existingDomainEvent(db: Firestore, eventId: string): Promise<EnqueueResult | null> {
  const eventKey = hash(eventId);
  const snapshot = await db.collection(EVENT_COLLECTION).doc(eventKey).get();
  return snapshot.exists ? { status: 'ALREADY_QUEUED', eventKey } : null;
}
