# FAR-S2-02 — Demo login backend handoff

## Contract

Callable `demoLogin`, region `asia-southeast2`, receives exactly
`{ peran: 'ASISTEN' | 'PRAKTIKAN' }` and returns `{ customToken: string }`.
Firebase callable HTTP wraps these as `data` and `result`; use the SDK helper.
UIDs, email/password, and role claims are not accepted from clients. The server
maps each choice to a fixed, different demo UID and checks Firebase Auth plus its
Firestore profile before signing. No account, profile, or role is created/changed.

Signed-out callers are allowed only with valid App Check from the configured
Android Firebase app. The callable enforces App Check, consumes limited-use tokens,
and rejects replayed/missing consumption results. This is the agreed attested-build
access model; no anonymous Auth session, password, or client secret is required.

The function is disabled by default. It requires both an explicit demo/staging
environment and an exact runtime-project allowlist match. No existing Firebase
project is assumed to be staging. Operators must not label a production project
as demo/staging; runtime cannot independently infer the business use of a project.

## Backend configuration

Copy `functions/.env.example` to ignored `functions/.env.<staging-project-id>`.
Set the following only for a dedicated staging/demo project with synthetic data:

| Parameter | Value |
| --- | --- |
| `DEMO_LOGIN_ENABLED` | `true` to explicitly enable; default `false` |
| `DEMO_LOGIN_ENVIRONMENT` | `demo` or `staging`; default `production` rejects |
| `DEMO_LOGIN_PROJECT_ID` | Exact Firebase/GCP staging project ID |
| `DEMO_LOGIN_ANDROID_APP_ID` | Registered Firebase Android app ID, not Android package name or EAS project ID |
| `DEMO_LOGIN_ASISTEN_UID` | Existing dedicated demo Asisten Auth UID |
| `DEMO_LOGIN_PRAKTIKAN_UID` | Existing dedicated demo Praktikan Auth UID |

Both accounts must be enabled in Auth with matching profile role/email in
`pengguna/{uid}`. Profiles need the normal name, NIM, and 8-character participant
code fields. If a profile stores `uid`, it must match its document/Auth UID.

Store a cryptographically random secret of at least 32 characters as
`DEMO_LOGIN_RATE_LIMIT_SALT` in Firebase Secret Manager. Never store its value in
this repository or an `EXPO_PUBLIC_` variable. It is bound only to this function.
Secret creation/binding is a deployment prerequisite even when the feature is off.

The function service account needs Firebase Auth/Firestore access, permission to
sign custom tokens (`iam.serviceAccounts.signBlob`), and the Firebase App Check
Token Verifier role for replay protection. Configure App Check for the staging
Android registration and the development device's private debug secret (or Play
Integrity for an appropriately signed distribution build). There is no emulator
App Check bypass. Do not weaken enforcement to make offline requests pass.

Deploy only this function after configuration, explicitly selecting staging:

```sh
npx firebase-tools deploy --only functions:demoLogin --project <staging-project-id>
```

This PR does not deploy, create projects/accounts, set secrets, or grant IAM roles.

## Rate limiting and storage

Before account lookup/signing, a Firestore transaction reserves both a global
quota (60/minute) and a caller quota (5/minute shared across both roles). The caller
key is an HMAC of the verified app ID and server-observed IP using the private
salt; client IDs/forwarded headers and raw IPs are not stored. Fixed-minute windows
may allow bursts across a boundary; shared campus NAT users share a caller quota.

Documents under `_demoLoginLimits` are server-only under the existing catch-all
deny Rules. Counters are shared across instances, fail closed on backend failure,
and contain `windowStart`, `count`, and `expiresAt`. Existing per-caller documents
are reused. Optionally enable Firestore TTL on `expiresAt` for idle-caller cleanup;
expiration does not depend on TTL deletion. No Rules changes are needed.

No raw token, password, reason text, private key, IP, or backend exception is logged
by the new code. Successful responses contain only the ephemeral custom token.
The app passes it directly to Firebase Auth; it is not exposed to UI or persisted.

## Aqilla's client integration

Configure the public build flags from root `.env.example` in `.env.local` or the
matching Expo environment: enabled `true`, environment `demo`/`staging`, and the
exact same staging Firebase project ID. These flags are not authorization. Keep
them off/production in production builds; the server independently rejects access.
The installed `google-services.json` must point at that staging project. Changing
the Firebase native configuration requires a new development build.

Use `demoLoginTersedia` to hide/disable the demo buttons. Call
`masukDemo('ASISTEN')` or `masukDemo('PRAKTIKAN')` from
`src/services/demo-login-service.ts`. The helper returns `Hasil<Pengguna>`, matching
the manual login pattern; failures expose `pesan`, not a raw token/error. It uses
limited-use App Check tokens, signs in with the returned custom token, validates
the resulting profile/role, and lets the existing auth context drive navigation.
It rejects unsupported platforms, an active account, and duplicate demo attempts.
Invalid profiles are signed out only while still on the same demo session.

While any login is pending, disable all login actions (manual and demo) in the UI.
The helper also checks for a manual login that completed while the callable was
pending. The UI integration and account-switch controls remain Aqilla's task.
Manual login is unchanged, and demo failures do not prevent using it.

## Validation and rollback

Run `npm --prefix functions run test:demo-auth`, Functions lint/build, app lint and
typecheck, and `node --test tests/native/demo-login-service.test.cjs`.
Tests use synthetic accounts and mocked Auth/Firestore/native adapters, plus a
local HTTP check of missing App Check enforcement. They do not prove live IAM
signing, real App Check consumption, device sign-in, or Firestore emulator behavior.
Those require a configured staging project/device and have not been run here.

To disable access, set backend `DEMO_LOGIN_ENABLED=false` and redeploy this function;
turn off the client flags/hide buttons too. For an urgent shutdown, disable the
dedicated demo accounts and revoke their refresh tokens: disabling the callable
alone does not sign out existing Firebase sessions. No data migration is required.

References: [Custom tokens](https://firebase.google.com/docs/auth/admin/create-custom-tokens),
[App Check enforcement/replay protection](https://firebase.google.com/docs/app-check/cloud-functions),
[Functions parameters/secrets](https://firebase.google.com/docs/functions/config-env),
[RNFirebase callable options](https://rnfirebase.io/functions/usage).
