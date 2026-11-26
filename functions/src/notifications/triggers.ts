import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { expr, projectID } from 'firebase-functions/params';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';

import { EVENT_COLLECTION, INTENT_COLLECTION } from './notification-contract.js';
import { createNotificationRuntime } from './runtime.js';

if (!getApps().length) initializeApp();
const runtime = createNotificationRuntime(getFirestore(), getMessaging());
const options = {
  region: 'asia-southeast2',
  serviceAccount: expr`hadirin-notifications@${projectID}.iam.gserviceaccount.com`,
  minInstances: 0,
  timeoutSeconds: 60,
};

// Firestore nextAttemptAt and the scheduled scan drive retries for both triggers.
export const queueNotificationIntent = onDocumentCreated({
  ...options,
  document: `${INTENT_COLLECTION}/{eventId}`,
  maxInstances: 3,
  concurrency: 1,
  retry: false,
}, event => runtime.queueIntent(event.params.eventId));

export const deliverNotificationEvent = onDocumentCreated({
  ...options,
  document: `${EVENT_COLLECTION}/{eventKey}`,
  maxInstances: 5,
  concurrency: 1,
  retry: false,
}, event => runtime.deliverEvent(event.params.eventKey));

export const recoverNotifications = onSchedule({
  ...options,
  schedule: '*/2 * * * *',
  timeZone: 'Asia/Jakarta',
  maxInstances: 1,
  concurrency: 1,
  retryCount: 0,
}, () => runtime.recover());
