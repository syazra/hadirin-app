# Notification delivery on Firebase Blaze

The assistant app records a `notificationIntents/{eventId}` document in the same
Firestore transaction that opens a session, changes its schedule, or decides a
leave request. The source document links back through `notificationEventId`.
The existing Rules enforce that link and restrict clients from reading or
changing backend processing state.

## Delivery

- `queueNotificationIntent` processes new intents in Jakarta
  (`asia-southeast2`). It resolves active class members for session alerts or
  the applicant for a leave decision. It creates deterministic
  `notificationEvents` jobs and records the selected recipients in one
  transaction. Retries reuse those recipients.
- `deliverNotificationEvent` processes new jobs through the Firebase Admin SDK.
  Each job uses a two-minute lease and a five-attempt budget. The delivery
  ledger skips devices already accepted by FCM. A definitively invalid token
  is removed only if it still matches the installation registry.
- `recoverNotifications` scans both collections every two minutes for due
   work. It resumes existing pending records, delayed retries, and expired
   leases. Terminal records have no due timestamp. The Firestore queue controls
  retries for both triggers and the scheduled scan.
- All three functions run only when `notificationConfig/runtime.deliveryBackend`
  equals the string `firebase`. The v1 FCM payload and stable Android tray
  tag remain compatible with installed clients. A crash after FCM accepts
  a send and before Firestore records it can cause a repeat.

## Deploy and cut over

1. Confirm `ppk-hadirin` is on Blaze, with the notification Rules already
   deployed and the FCM HTTP v1 and Cloud Scheduler APIs enabled. The Firebase
   CLI sets up the supporting Functions and Eventarc resources. Set a
   [billing budget alert](https://firebase.google.com/docs/projects/billing/budget-alerts).
2. Create `hadirin-notifications@ppk-hadirin.iam.gserviceaccount.com` with
   `roles/datastore.user`, `roles/firebasecloudmessaging.admin`, and
   `roles/eventarc.eventReceiver`. The deployer needs permission to act as
   this account. The functions use Application Default Credentials from
   the attached identity. [Eventarc IAM](https://docs.cloud.google.com/eventarc/standard/docs/functions/roles-permissions)
3. Keep `deliveryBackend` absent and retain the current Vercel production
   deployment and QStash schedule for rollback. Hold any Vercel deployment
   that removes the notification endpoint. Deploy only these functions from
   the reviewed migration revision.

   ```sh
   npx firebase-tools deploy --project ppk-hadirin --only functions:queueNotificationIntent,functions:deliverNotificationEvent,functions:recoverNotifications
   ```

   Verify the Eventarc and Scheduler identities have `roles/run.invoker` on
   their respective Cloud Run services. Keep public access disabled. Verify
   the authenticated Scheduler job runs and an unauthenticated call is denied.
4. Review the pending intents and jobs by age and state before enabling
   delivery. Pause QStash and confirm there are no pending deliveries or
   running Vercel worker invocations. Allow any outstanding two-minute lease to expire
   before setting `deliveryBackend` to `firebase` in the Firestore console.
   Edit this field in place so the current `requireIntent` value is preserved.
   [Pause a QStash schedule](https://upstash.com/docs/qstash/api-reference/schedules/pause-a-schedule)
5. Confirm the due backlog drains and follow the
   [Android acceptance checks](sprint-3-notifications.md#android-acceptance).
   Use the intent and job IDs in Cloud Logging to trace the triggers. Review
   delivery states, age of due work inspected, FCM acceptances, failures,
   missing tokens, and exhausted jobs. Investigate
   sustained queue growth and confirm receipt on a device. Keep raw tokens
   and leave reasons out of incident logs.
6. After 24 healthy hours, deploy the Vercel cleanup and retire the paused
   schedule and notification-only settings. Keep the Firebase and Gemini
   credentials still used by the Vercel classification and attendance routes.

## Roll back during cutover

Remove `deliveryBackend` from `notificationConfig/runtime`. Allow in-flight
Firebase invocations and leases to settle, then resume QStash against the
retained Vercel deployment. Keep the intent, job, and delivery records so
the previous worker can resume from the same queue.

Firebase Cloud Messaging is a no-cost product. Blaze usage can incur charges
for the delivery infrastructure. [Firebase pricing](https://firebase.google.com/pricing)
