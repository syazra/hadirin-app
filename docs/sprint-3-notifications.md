# FAR-S3-01..05 — Android notifications

The Android client registers device tokens, handles foreground messages, and
routes notification taps. Session and izin updates create Firestore intents
for the Firebase Cloud Functions worker on Blaze.

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

## Notification events

- Opening a session sends `SESI_DIBUKA` to active members of the class.
- Changing the title, lab, start time, or end time sends `JADWAL_BERUBAH` to
  active members. Session closing, archiving, and unchanged edits create no event.
- Deciding a pending izin sends `IZIN_DISETUJUI` or `IZIN_DITOLAK` to the
  applicant. AI classification updates leave the notification state alone.

See the backend runbook for deploying the functions, switching traffic,
and rolling back. [Notification delivery on Firebase Blaze](notification-backend.md)

## Automated checks

```sh
npm run lint
npm run typecheck
npm run test:notifications
npm --prefix proxy-gemini run typecheck
npm --prefix proxy-gemini test
npm --prefix functions run lint
npm --prefix functions run test:notifications
npm --prefix tests/rules run typecheck
npm --prefix tests/rules run test:notification-intents
npm --prefix tests/rules run test:notification-tokens
```

Run the Functions notification tests and the two rules test commands with the
Firestore Emulator on `127.0.0.1:8080`. Set
`FIRESTORE_EMULATOR_HOST=127.0.0.1:8080` for the Functions tests to exercise
Firestore transactions, event handlers, and recovery with mocked FCM.

## Android acceptance

1. Build and install the Android development APK with
   `npx eas-cli@latest build --platform android --profile development`.
   Use the matching Firebase configuration and authorized App Check debug token
   for the development build. Start Metro with `npx expo start --dev-client`
   when required.
2. Use two Android devices with an assistant and a student who is an active
   member of a test class. The student enables notifications in Profile.
   Confirm the installation registry entry and enable Firebase delivery in the
   Firebase environment used by the test devices.
3. Open a session, change its schedule, approve a pending izin, and reject a
   separate pending izin. Use the Functions logs to confirm both Firestore
   triggers handled each notification before the recovery scan. Confirm receipt
   in foreground, background, and after dismissing the app from recent apps.
   Confirm each tap opens the correct session or izin and verify an unrelated
   account receives nothing.
4. Check denied permission, Settings recovery, token refresh, and offline
   registration. Confirm an old-account tap cannot navigate after switching
   accounts. Verify the assistant can close and archive a session once
   enforcement is enabled.
5. Record the app build, timestamps, and corresponding sanitized worker
   results with the device evidence. FCM acceptance and device receipt are
   distinct checks.

References include [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/),
[Expo Android builds](https://docs.expo.dev/build/setup/),
and [RNFirebase Messaging](https://rnfirebase.io/messaging/usage).
