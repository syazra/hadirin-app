import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';
import { EVENT_COLLECTION } from './notification-contract';
import { NotificationRetry, processNotification } from './process-notification';

export const dispatchNotification = onDocumentCreated({
  document: `${EVENT_COLLECTION}/{eventKey}`, region: 'asia-southeast2',
  retry: true, timeoutSeconds: 60, maxInstances: 3,
}, async event => {
  if (!event.data) return;
  if (!getApps().length) initializeApp();
  try {
    const result = await processNotification(getFirestore(), getMessaging(), event.params.eventKey);
    logger.info('Notification worker completed', { state: result.state, accepted: result.accepted ?? 0 });
  } catch {
    logger.warn('Notification worker will retry');
    throw new NotificationRetry();
  }
});
