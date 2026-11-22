# FAR-S3-01..05 — Android notifications

This branch completes the client and connects the shared backend from FAR-S3-02.
It integrates Azka's session-open and Binar's schedule-update domain handlers,
adds the izin-decision handler, and retains `recordAttendance` and `demoLogin`.
No deployment, cloud build, push, or PR creation is performed by this change.

## User flow

- Both profiles show a notification card explaining session, schedule and izin
  updates. Permission is requested only after **Aktifkan notifikasi**. A persistent
  installation flag prevents another system prompt after denial; subsequent
  attempts open Settings. Android below API 33 uses the existing system permission
  state. Returning to the app rechecks permission and registration.
- Foreground messages show an accessible, dismissible banner for eight seconds.
  Background/terminated notification messages use Android's notification tray.
  A tap opens the existing session or izin details after Auth, profile and Router
  readiness. No new detail screens or inbox are added.
- Status distinguishes unsupported, disabled, registering, registered and failed.
  Registration success is not proof that every future notification will display;
  Android channel preferences, Doze and force-stop can still affect delivery.
- iOS/web do not request permission, register tokens, or navigate notification
  messages. Existing app functionality remains subject to its Android-only
  Firebase support; this change does not enable Firebase on other platforms.

## Client lifecycle and isolation

`index.js` installs the background handler **before** `expo-router/entry`.
`NotificationProvider` owns the foreground/tap listeners and initial notification.
They are removed on unmount. Token-refresh and AppState listeners are scoped to a
completed signed-in profile and cleaned up on account change/logout.

The installation key comes from Firebase Installations `getId`; the value remains
an FCM **registration token**, using `getToken/onTokenRefresh/deleteToken` with
`messaging_installation_id_enabled: false`. FID messaging remains disabled.
Auto-init starts disabled and is enabled only after permission, authentication and
owner rotation; logout/permission revocation disables it before invalidating the token.

Registry writes use a Firestore transaction at
`pengguna/{uid}/perangkat/{installationId}`, preserving the existing schema and
owner-only Rules. Transactions fail offline rather than leaving an unconditional
queued token write. Refresh updates the same record. Reinstall obtains a new native
installation/token; old invalid registrations are pruned by the sender when FCM
reports them invalid. Multiple devices retain independent records.

Native/token operations are serialized. Account generation and Auth UID checks
prevent an in-flight previous login from registering under another user. Local
owner metadata requires native token invalidation before a new account can
register. Logout suspends registration before attempting owner-only deletion and
native invalidation. Notification cleanup has an eight-second logout budget, so
offline notification failure does not block signing out. Work already started may
finish later; a new account's registration waits behind cleanup and rotates again.
An unsuccessful logout restores registration for the still-active account.

Permission revocation removes/invalidate the owned registration when detected.
Registration retries at 1/3/10 seconds, then stops until manual recovery, token
refresh or another foreground transition. Each network/native token operation has
a timeout. No permanent background retry loop or extra permission prompt is used.

`expo-secure-store` holds the owner UID, permission-attempt flag and a bounded
24-entry SHA-256 deduplication cache. Tokens, notification bodies and reasons are
not persisted there. Presentation and tap keys differ, so a shown banner can still
open its target. The background handler records presentation only, without rendering
or navigating. Deduplication persists across app restarts but is limited to recent
events; it is not an indefinite delivery history.

## Payload and navigation

FCM string data contains `version`, `eventId`, `type`, `entityId`, `routeKey`, plus
server-assigned **`recipientUid`** for each recipient's device batch. Types are
`SESI_DIBUKA`, `JADWAL_BERUBAH`, `IZIN_DISETUJUI`, `IZIN_DITOLAK`. Binar's internal
schedule event now uses the same canonical type. The sender ignores legacy raw
route fields from the domain payload and emits only its allowlisted contract.

The client rejects malformed versions/types/IDs and route/type mismatches. It
constructs Router destinations itself, checks the current recipient and role, then
reads the entity from the server under Firestore Rules. Session navigation requires
an active member of an active class or its owning Asisten; izin navigation requires
the applicant or owning Asisten. Deleted/inaccessible records and failed requests
show a safe message. The Auth UID is rechecked after asynchronous validation and
deduplication before navigation. Account changes clear account-scoped presentation.

## Domain producers and reliability

- `onSessionOpened`: `BELUM_DIBUKA -> DIBUKA` only, active class members excluding
  the owner. Uses the source CloudEvent identity, so reopening a session creates a
  different event while retries reuse one identity.
- `onScheduleUpdated`: retains Binar's field comparisons and recipient selection;
  status-only/no-op/archive changes do not create a schedule alert. Source identity
  distinguishes subsequent edits to the same session.
- `onIzinDecision`: `MENUNGGU -> DISETUJUI/DITOLAK` only, unchanged applicant,
  session and class identity, existing Praktikan profile, applicant UID only.
  Reason-only/AI-only/final-to-final updates do not notify.

All producers return/propagate queued, already-queued or skipped outcomes; none
claims receipt on the device. The historical `dikirim` field in the session/schedule
domain helper means a newly queued event, not an FCM delivery acknowledgment.
Already-created events short-circuit subsequent recipient queries to preserve the
original audience/content during source retries. A concurrent enqueue race is
resolved by the shared transactional event creation; conflicting queries retry and
then reuse the existing event. Producers retry enqueue failures with sanitized
errors, independently of the business write that already committed.

The shared worker retains per-device outcomes, a lease, bounded transient retries,
conditional invalid-token deletion, and stable Android notification tags. See
[notification-backend.md](notification-backend.md) for the send/commit crash window.
There is **no exactly-once guarantee**: FCM acceptance and ledger writes are separate
operations, OS tray display precedes client processing, and already-accepted messages
cannot be revoked by logout. All lock-screen text is generic and excludes submitted
reasons, names, schedule titles and locations. The client recipient guard prevents
an old-account message from navigating into a new session.

The current shared contract supports up to 500 recipient UIDs per event. Larger
classes require an explicit stable partitioning strategy before deployment; do not
silently truncate the audience or change partition membership during retries.

## Reproducible checks

```sh
npm ci
npm --prefix functions ci
npm run lint
npm run typecheck
npm run test:notifications
node --test tests/native/firebase-native-services.test.cjs tests/native/demo-login-service.test.cjs
node --import tsx --test tests/auth/auth-profile-race.test.mjs
npm --prefix functions run lint
npm --prefix functions run test:notifications
node --test functions/lib/attendance/__tests__/*.test.js
npm --prefix functions run test:demo-auth
npm --prefix tests/rules run typecheck
# With Firestore Emulator running on 127.0.0.1:8080:
npm --prefix tests/rules run test:notification-tokens
npx expo export --platform android --output-dir .expo/notification-export
```

Unit tests use mocked native/Auth/FCM adapters and in-memory database behavior.
They cover permission denial/prompt suppression, token refresh, concurrent account
switch/logout, offline recovery, wrong-owner routes, malformed payloads, durable
dedupe, producer transitions, shared sender retries and exported handlers.
Android JS export verifies bundling, not native linking or device delivery.
Live Firebase/device and Rules emulator results must be recorded separately.

Validation recorded on 22 November 2026: app lint/typecheck, Functions lint/build,
19 client notification tests, 26 backend notification/domain integration tests,
28 existing native/demo-client checks, 31 demo-auth backend checks, 10 attendance
checks, the auth/profile race check, Rules-package typecheck, Android JS export and
`git diff --check` passed. The auth/profile check uses `--import tsx`; Node's plain
strip-only runner does not support its existing TypeScript parameter properties.
Firestore Emulator was not running on port 8080, and the available Java runtime
was 17; the Rules suite and native/device matrix were not executed.

## Build, deployment and device validation

1. Use the team's explicitly configured Firebase development/staging project and
   matching `google-services.json`, Android package and App Check registration.
   Configure a private debug attestation token for a development build, or Play
   Integrity for the configured distribution build. Do not commit debug tokens.
2. Build a **new** Android development binary: `npx eas-cli@latest build --platform
   android --profile development`. SecureStore adds native code; an OTA update
   alone cannot update an old binary. Keep the team's EAS project linkage and
   existing Maps/camera/location configuration. Install the APK and run
   `npx expo start --dev-client` if using Metro.
3. Confirm FCM HTTP v1 is enabled, the Functions runtime has messaging/Firestore
   access, and the existing owner-only Rules are deployed by their integrator.
   Deploy worker and producers together to the explicit staging project:

   ```sh
   npx firebase-tools deploy --project <staging-project-id> --only functions:dispatchNotification,functions:onSessionOpened,functions:onScheduleUpdated,functions:onIzinDecision
   ```

   Region is `asia-southeast2`; no secret server key is placed in Expo. This command
   leaves the existing callable handlers and demo-login configuration untouched.
4. Sign in on two physical Android devices; enable notifications through Profile.
   Confirm two installation documents under the same UID, then test opening a
   session, changing its schedule, approving an izin and rejecting another izin.
   Repeat each with the recipient foreground, background and terminated. Retain
   screenshots/video plus the corresponding event and sanitized ledger outcomes.
5. Deny permission, tap activation again (Settings, no repeat prompt), grant in
   Settings and return. Revoke permission later. Verify token refresh, reinstall,
   logout/login and two different accounts on one device. An old-account tap must
   never open the new account's entity.
6. Test offline registration and recovery, missing devices, invalid/unregistered
   tokens, transient send failure, duplicate source delivery, malformed payloads,
   deleted targets and inactive/non-member recipients. Preserve camera/QR and
   location/Maps regression evidence. Do not mark acceptance complete from mocks.

## Rollback and troubleshooting

- Disable/remove producer deployments to stop new events. Pause the worker if
  needed; retain outbox/ledger records while events may retry. Do not clear records
  to force a resend. Queued FCM messages may still arrive.
- Inspect sanitized event state/accepted/failed/no-token counts and device ledger
  codes. `COMPLETE` means processing finished, not that every device displayed it.
- No registry: check permission, profile readiness, Android native module presence,
  network and owner-only Rules. Use Profile **Coba lagi** or Settings recovery.
- Queued without processing: verify worker export/deployment/region and Eventarc.
  No event at all: verify the corresponding producer export, valid transition and
  active recipients. Never debug by printing raw tokens or submitted reasons.
- Accepted without UI: check Android app/channel settings, force-stop/battery state,
  the installed binary's Firebase registration, and the device network. A cold
  notification tap requires a matching recipient and completed login/profile.
- Keep demo-login disabled unless its separate staging prerequisites are configured.

References: [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/),
[custom Router entry](https://docs.expo.dev/router/installation/#custom-entry-point-to-initialize-and-load-side-effects),
[RNFirebase Messaging](https://rnfirebase.io/messaging/usage),
[SecureStore](https://docs.expo.dev/versions/v58.0.0/sdk/securestore/),
[Firestore triggers](https://firebase.google.com/docs/functions/firestore-events).
