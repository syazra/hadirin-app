import { Timestamp, type Firestore } from 'firebase-admin/firestore';
import { EVENT_COLLECTION, INTENT_COLLECTION } from './notification-contract';
import { processIntent, rescheduleIntent } from './process-intent';
import { NotificationRetry, processNotification, type NotificationSender } from './process-notification';

const BATCH_LIMIT = 12;
const WORKER_BUDGET_MS = 45_000;
const MIN_DELIVERY_TIME_MS = 7_000;

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
    let state: string;
    try {
      state = await processIntent(db, intent.id, now());
    } catch {
      state = await rescheduleIntent(db, intent.id, now());
    }
    summary.intents[state] = (summary.intents[state] ?? 0) + 1;
  }

  const jobs = await due(EVENT_COLLECTION);
  for (const job of jobs.docs) {
    if (deadline - now() < MIN_DELIVERY_TIME_MS) break;
    recordAge(job.get('createdAt'));
    try {
      const result = await processNotification(db, messaging, job.id, now, deadline);
      summary.deliveries[result.state] = (summary.deliveries[result.state] ?? 0) + 1;
      summary.accepted += result.accepted ?? 0;
      summary.failed += result.failed ?? 0;
      summary.noTokenUsers += result.noTokenUsers ?? 0;
    } catch (error) {
      if (!(error instanceof NotificationRetry)) throw error;
      summary.deliveries.RETRY = (summary.deliveries.RETRY ?? 0) + 1;
    }
  }
  return summary;
}
