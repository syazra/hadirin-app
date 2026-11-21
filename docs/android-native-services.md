# PR 2 — Android native Firebase services

## Changes

Messaging, App Check, and Installations use 27.1.1, matching the existing
RNFirebase modules. Expo SDK 58 installs them through `npx expo install`.
App Check and Messaging have Expo config plugins; Installations autolinks.
The local icon plugin copies a white calendar/check vector drawable during CNG
because RNFirebase's plugin only adds its manifest reference. Generated Android
files are not maintained in Git. Camera/location configuration is preserved.

`getFirebaseServices()` configures App Check before Auth/Firestore access.
Development JS uses the native debug provider; release JS uses Play Integrity.
Initialization is cached; synchronous failure leaves ordinary login available
with `appCheck: null` and a generic warning. Native provider setup is asynchronous:
an instance does not prove a valid attestation token. Future protected callables
must enforce App Check server-side; there is no bypass when setup/token retrieval
fails. This PR does not enable Firebase Console enforcement.

`getFirebaseNativeServices()` exposes App Check, Messaging, and Installations on
Android, without calling token or permission APIs. Existing platform guards reject
iOS/web before initializing native services. iOS Firebase/APNs is outside this PR.

`firebase.json` keeps FCM registration-token mode enabled by leaving FID messaging
opt-in false. The installation ID will be a device registry key, not an FCM target.
Messaging auto-init is disabled until the permission/token lifecycle PR enables it
in context. POST_NOTIFICATIONS is declared without requesting runtime permission.
The native App Check auto-refresh default is disabled until JS selects a provider;
JS initialization then enables refresh. No notification listeners/sender/demo
endpoint or permission prompts are added here.

## Attestation setup and development build

Use the existing linked EAS project and its Android Firebase registration; do not
create a new project or replace google-services.json to work around access errors.
Register the app in Firebase App Check. On a development device, register its
native-generated debug secret privately in Firebase Console. Do not commit it,
embed it in EXPO_PUBLIC variables, or share device logs containing it.
Release builds require Play Integrity configured for the signing certificate and
distribution path. Never enable the debug provider in a release build.

After native changes, rebuild rather than sending an OTA update to an old client:

```sh
npx eas-cli@latest build --platform android --profile development
npx expo start --dev-client
```

Install the new APK; Expo Go lacks these native modules. EAS development explicitly
uses the development environment. Preserve the existing cloud signing credentials.

## Validation and outstanding gate

Passed before handoff: app lint/typecheck, Android JS export, Android-only config
introspection (camera and foreground location permissions preserved), and six
mocked service checks covering provider selection, initialization ordering/cache,
unsupported platforms, safe setup failure, and native accessors.

Cloud build access failed: the logged-in EAS account mufaa cannot read linked
project 92cc7b24-69f8-401b-acc1-24a2ecd61591. The user requested skipping Android
build/device testing. No APK build, physical-device module loading, attestation,
camera scan, GPS, or permission smoke test has been verified. Mock/bundle checks
do not satisfy the device gate.

When access is available: rebuild, verify login still works, inspect native service
accessors without logging identifiers/tokens, verify debug attestation privately,
then scan QR and exercise location allow/deny/GPS-off. Verify a release variant uses
Play Integrity. Full notification/token lifecycle testing belongs to later PRs.

References: [App Check](https://rnfirebase.io/app-check/usage),
[Messaging](https://rnfirebase.io/messaging/usage),
[Installations](https://rnfirebase.io/installations/usage),
[Expo Android build](https://docs.expo.dev/tutorial/eas/android-development-build.md).
