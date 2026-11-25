import type { Timestamp } from 'firebase-admin/firestore';
import { hash, normalizeNotification, type NotificationInput } from './notification-contract';

export function notificationJob(raw: NotificationInput, createdAt: Timestamp) {
  const input = normalizeNotification(raw);
  return {
    eventKey: hash(input.eventId),
    data: { input, state: 'QUEUED', attempts: 0, createdAt, nextAttemptAt: createdAt },
  };
}
