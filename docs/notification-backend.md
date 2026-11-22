# FAR-S3-02 — Shared notification backend

The original FAR-S3-02 change provides a server-only queue/sender and an exported
delivery worker. The subsequent FAR-S3-01..05 implementation connects the domain
producers and Android client; see [sprint-3-notifications.md](sprint-3-notifications.md).
No live deployment or device validation has been performed here.

## Contract for domain handlers

Import `sendToUsers` from `functions/src/notifications/send-notification.ts`:

```ts
await sendToUsers({
  eventId: event.id, // stable source CloudEvent identity; reuse on retries
  type: 'SESI_DIBUKA',
  entityId: sesiId,
  routeKey: 'SESI',
  recipientUids: activeMemberUids,
  title: 'Presensi dibuka',
  body: 'Buka aplikasi untuk melihat sesi praktikum.',
});
```

Types: `SESI_DIBUKA`, `JADWAL_BERUBAH`, `IZIN_DISETUJUI`, `IZIN_DITOLAK`.
Session/schedule events use routeKey `SESI`; izin events use `IZIN`. Recipients
are deduplicated/sorted, with a maximum of 500 input UIDs per event. Larger
audiences must be partitioned using stable source-event/subgroup keys.

Domain handlers must resolve authorized recipients from active membership/class
ownership or the izin applicant and pass stable snapshot-derived content. Never
accept recipient lists, arbitrary routes, reasons for izin, credentials, or private
lock-screen content from a client. This helper is not an HTTP/callable endpoint.

The result is `{ status, eventKey }`: `QUEUED`, `ALREADY_QUEUED`, or
`NO_RECIPIENTS`. It does not claim delivery. Conflicting content under the same
event ID fails instead of silently dropping a different event. Schedule changes
must use each source update's identity, not just the session ID. Repeated source
delivery must preserve event identity/content.

FCM data is strings only: `{ version: '1', eventId, type, entityId, routeKey,
recipientUid }`. The worker assigns `recipientUid` per recipient's device batch;
domain producers do not accept it from clients. No arbitrary URL or raw route is
emitted. The Android client validates the contract, account and entity access.
Message size is checked in UTF-8 with headroom for recipient metadata.

## Storage and retry behavior

- Existing registry: `pengguna/{uid}/perangkat/{installationId}`. Preserve its
  current `fcmToken`, optional platform/deviceName/appVersion and timestamp schema.
  Multiple installations are supported. Raw tokens remain only in that registry
  and the in-memory FCM request, not operational logs or the delivery ledger.
- Outbox: `notificationEvents/{sha256(eventId)}`. Created atomically once with a
  canonical payload fingerprint; duplicate events do not create another job.
- Recipient progress under `recipients` skips completed recipients on retries.
  Empty registries are recorded without an FCM call. Completed recipients do not
  pick up newly registered devices for an old event on later retries.
- Device ledger under `deliveries` uses UID + installation identity. It records
  token hash, attempts, safe error code and `ACCEPTED`/`RETRY`/`FAILED`; an accepted
  installation is skipped on retries, including token refresh.
- The worker claims a two-minute transactional lease; concurrent invocations wait
  for retry rather than send concurrently. Its timeout is 60 seconds, with a
  45-second soft yield before another batch/recipient. Messages use batches of at
  most 100 (below FCM's 500 limit). Ledger writes are grouped with bounded parallelism.
- Eventarc handles retry backoff. At most five claimed processing passes are
  allowed; persistent transient failures become `EXHAUSTED`. A database outage
  before a claim cannot persist an attempt counter and is bounded by the platform
  event retry window instead. Busy leases do not spend the send-attempt budget.
- Root `COMPLETE` means processing finished, not every device received a message.
  Inspect accepted/failed/noTokenUsers counts. `INVALID` means a malformed stored
  event; `EXHAUSTED` stops automatic delivery attempts. Device `RETRY` at an
  exhausted root describes its last outcome, not a scheduled future send.

Only definitive invalid/unregistered token responses prune registry records.
Cleanup checks the current token transactionally and leaves refreshed tokens
intact. Generic invalid payloads or batch errors never delete individual tokens.
Transient/unknown errors retry; known credential/payload failures stop for that
token version. Unknown exception text/codes are not persisted or logged.

Firestore and FCM do not share a transaction. A process can crash after FCM
acceptance but before the ledger commit; a retry can then repeat an alert. Stable
Android notification tags reduce duplicate tray entries. Later client event-ID
deduplication is still needed; this implementation does not promise exactly-once
delivery, ordering, or that a notification was displayed/read. Duplicate registry
entries containing the same token can also produce repeated delivery attempts;
the client registry lifecycle must keep installation records consistent.

## Rules ownership and validation

The current owner-only token Rules already exist. All outbox/progress/ledger client
access is denied by the existing catch-all Rule, including Asisten clients. No
Rules changes are made. The new emulator suite covers registration/update/delete,
multi-device access, malformed fields, wrong UID/unauthenticated access, and
server-only outbox paths; Azka remains the Rules integrator.

```sh
npm --prefix functions run test:notifications
npm --prefix functions run lint
npm --prefix functions run build
npm --prefix tests/rules run typecheck
# With Firestore Emulator running on 127.0.0.1:8080:
npm --prefix tests/rules run test:notification-tokens
```

Backend tests use a transactional in-memory Firestore adapter and mocked FCM.
They cover concurrent enqueue, leases, duplicate suppression, partial retries,
invalid-token refresh races, error redaction, batching and bounded failures.
They do not prove real FCM delivery or distributed Firestore/emulator behavior.
The Rules emulator suite has not been run here: no emulator is running and the
available Java runtime is 17. Rules typecheck and app lint/typecheck are run.

## Deployment handoff

When authorized/configured, deploy `functions:dispatchNotification` in
`asia-southeast2` with Firebase CLI, keeping the existing Functions workspace and
`recordAttendance` export. Enable FCM HTTP v1 and grant its runtime service account
the appropriate messaging/Firestore permissions. No server key belongs in Expo.
The worker's outbox is server-only and idle until domain handlers enqueue events.

In a development Firebase project, register real device tokens using the later
client PR, enqueue an authorized synthetic event from a backend test/script, then
inspect the counts/ledger and verify receipt on two devices. Verify no-token,
unregistered-token, partial failure and duplicate-event behavior. Retain terminal
records while source events can still retry; deleting ledger records too early
removes deduplication. Investigate `EXHAUSTED`/`FAILED` before deliberate replay.
Disable the worker/producer deployments to stop new dispatch; never clear the
outbox simply to force retries.

References: [Admin FCM sending](https://firebase.google.com/docs/cloud-messaging/send/admin-sdk),
[token cleanup](https://firebase.google.com/docs/cloud-messaging/manage-tokens),
[Firestore trigger semantics](https://firebase.google.com/docs/functions/firestore-events),
[retry behavior](https://firebase.google.com/docs/functions/retries).
