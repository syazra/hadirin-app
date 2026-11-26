import { Timestamp, type Firestore } from 'firebase-admin/firestore';
import { EVENT_COLLECTION, INTENT_COLLECTION } from './notification-contract.js';
import { processIntent, rescheduleIntent } from './process-intent.js';
import { NotificationRetry, processNotification, type NotificationSender } from './process-notification.js';

const BATCH_LIMIT = 12;
const WORKER_BUDGET_MS = 45_000;
const MIN_DELIVERY_TIME_MS = 7_000;

export async function queueIntent(db: Firestore, eventId: string, now: number) {
  try {
    return await processIntent(db, eventId, now);
  } catch {
    return rescheduleIntent(db, eventId, now);
  }
}

export async function deliverEvent(db: Firestore, messaging: NotificationSender, eventKey: string,
  now: () => number, deadline?: number): ReturnType<typeof processNotification> {
  try {
    return await processNotification(db, messaging, eventKey, now, deadline);
  } catch (error) {
    if (!(error instanceof NotificationRetry)) throw error;
    return { state: 'RETRY' };
  }
}

export async function runWorker(db: Firestore, messaging: NotificationSender,
  now: () => number = Date.now) {
  const start = now();
  const deadline = start + WORKER_BUDGET_MS;
  const summary = {
    intents: {} as Record<string, number>,
    deliveries: {} as Record<string, number>,
    queueAgeMs: 0, accepted: 0, failed: 0, noTokenUsers: 0,
  };
  const due = (name: string) => db.collection(name)
    .where('nextAttemptAt', '<=', Timestamp.fromMillis(now()))
    .orderBy('nextAttemptAt').limit(BATCH_LIMIT).get();
  const recordAge = (createdAt: unknown) => {
    if (createdAt instanceof Timestamp) {
      summary.queueAgeMs = Math.max(summary.queueAgeMs, now() - createdAt.toMillis());
    }
  };

  const intents = await due(INTENT_COLLECTION);
  for (const intent of intents.docs) {
    if (now() >= start + WORKER_BUDGET_MS / 3) break;
    recordAge(intent.get('createdAt'));
    const state = await queueIntent(db, intent.id, now());
    summary.intents[state] = (summary.intents[state] ?? 0) + 1;
  }

  const jobs = await due(EVENT_COLLECTION);
  for (const job of jobs.docs) {
    if (deadline - now() < MIN_DELIVERY_TIME_MS) break;
    recordAge(job.get('createdAt'));
    const result = await deliverEvent(db, messaging, job.id, now, deadline);
    summary.deliveries[result.state] = (summary.deliveries[result.state] ?? 0) + 1;
    summary.accepted += result.accepted ?? 0;
    summary.failed += result.failed ?? 0;
    summary.noTokenUsers += result.noTokenUsers ?? 0;
  }
  return summary;
}
