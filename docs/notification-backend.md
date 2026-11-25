# Sprint 3 notification backend on Firebase Spark

The assistant app records a notification intent in the same Firestore
transaction that opens a session, changes its schedule, or decides a leave
request. The Vercel worker processes the intents and sends FCM messages.
QStash wakes the worker every two minutes. FCM and the Firestore database stay
on the Firebase project already used by the app.

## Event capture and delivery

- The client creates a linked `notificationIntents/{eventId}` with the source
  ID, event type, and two server timestamps. The source document points to the
  event through `notificationEventId`. Rules verify both documents in the same
  commit. The client has no access to intent processing fields, the rollout
  setting, or delivery records.
- The worker resolves active class members for session alerts and the applicant
  for leave decisions. A single Firestore transaction creates deterministic
  `notificationEvents` jobs with the selected recipients and marks the intent
  processed. Later retries reuse those recipients. Old Firestore changes are
  outside the queue.
- Each delivery job uses a two-minute transactional lease and a five-attempt
  budget. The worker persists retry times and removes the due timestamp from
  terminal records. Each recipient's devices remain in
  `pengguna/{uid}/perangkat/{installationId}`. The ledger skips devices already
  accepted by FCM and only prunes a definitively invalid token if it still
  matches the registry.
- The FCM data contract remains version 1 with `eventId`, `type`, `entityId`,
  `routeKey`, and `recipientUid`. Android uses a stable tag for tray entries.
  A crash after FCM accepts a send and before Firestore saves acceptance can
  cause a repeat. A completed record reports processing and acceptance counts.
  Device receipt must be verified separately.

## Deploy and roll out

1. Verify the existing Vercel project uses `proxy-gemini` as its root, Firebase
   credentials for `ppk-hadirin`, and an enabled FCM HTTP v1 API. The Firebase
   service account needs Firestore read/write and FCM send access. Keep the
   service credentials and QStash signing keys in the Vercel environment.
2. Set `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`, and
   `QSTASH_NOTIFICATION_URL` to the exact stable HTTPS destination ending in
   `/api/notifications/process`. Deploy the Vercel backend. Check that an
   unsigned POST to the endpoint returns 401.
3. Deploy the compatible Rules with
   `npx firebase-tools deploy --project ppk-hadirin --only firestore:rules`.
   Keep `notificationConfig/runtime.requireIntent` false or absent at first.
4. Configure one QStash POST schedule to the same URL with cron
   `*/2 * * * *`, body `{}`, and delivery retries set to zero. The next tick
   recovers work from Firestore. Confirm the signed tick returns 204.
   One schedule uses 720 QStash deliveries per day
   under the current 1,000-delivery Free quota.
5. Follow the Android acceptance matrix in [Sprint 3 Android notifications](sprint-3-notifications.md).
   Once the assistants are on the updated build, set the Firestore boolean
   at `notificationConfig/runtime.requireIntent` to true in the Firebase
   console. Confirm a legacy assistant cannot perform the three push-producing
   operations and the updated build can. Session reads, creation, closing,
   and archiving continue to work.

## Operate and roll back

- Review QStash delivery status and Vercel logs for the next scan. The worker
  logs aggregate intent and delivery states, oldest processed queue age,
  acceptance, failures, and missing-token counts. Check terminal failures and
  sustained queue growth in Firestore. Keep raw tokens and izin reasons out
  of incident logs.
- Pause the QStash schedule and set `requireIntent` to false for compatibility
  rollback. Keep intent and delivery records so a restart can resume queued
  work without discarding deduplication. Check queued work and its age before
  resuming.
- Deployment and billing references include [QStash schedules](https://upstash.com/docs/qstash/features/schedules),
  [signature verification](https://upstash.com/docs/qstash/howto/signature),
  [QStash pricing](https://upstash.com/pricing/qstash), and
  [Firebase Admin FCM sending](https://firebase.google.com/docs/cloud-messaging/send/admin-sdk).
