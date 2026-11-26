import type { Firestore } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';

import type { NotificationSender } from './process-notification.js';
import { deliverEvent, queueIntent, runWorker } from './run-worker.js';

export function createNotificationRuntime(db: Firestore, messaging: NotificationSender, now = Date.now) {
  async function runWhenEnabled(context: Record<string, string>, work: () => Promise<object>) {
    try {
      const config = await db.doc('notificationConfig/runtime').get();
      if (config.get('deliveryBackend') !== 'firebase') return;

      info('Notification operation completed', { ...context, ...await work() });
    } catch {
      // The queue remains eligible for recovery. Keep raw Firestore and FCM errors out of logs.
      error('Notification operation failed', context);
      throw new Error('Notification operation failed');
    }
  }

  return {
    queueIntent: (eventId: string) => runWhenEnabled({ operation: 'queueNotificationIntent', eventId }, async () => ({
      state: await queueIntent(db, eventId, now()),
    })),
    deliverEvent: (eventKey: string) => runWhenEnabled({ operation: 'deliverNotificationEvent', eventKey }, () =>
      deliverEvent(db, messaging, eventKey, now)),
    recover: () => runWhenEnabled({ operation: 'recoverNotifications' }, () => runWorker(db, messaging, now)),
  };
}
