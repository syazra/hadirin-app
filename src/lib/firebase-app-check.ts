import type { FirebaseApp } from '@react-native-firebase/app';
import { initializeAppCheck, type AppCheck } from '@react-native-firebase/app-check';

let appCheck: AppCheck | null = null;
let attempted = false;

/** Configure before protected requests; an instance does not prove attestation succeeded. */
export function prepareAndroidAppCheck(app: FirebaseApp): AppCheck | null {
  if (attempted) return appCheck;
  attempted = true;

  try {
    appCheck = initializeAppCheck(app, {
      provider: {
        providerOptions: {
          android: { provider: __DEV__ ? 'debug' : 'playIntegrity' },
        },
      },
      isTokenAutoRefreshEnabled: true,
    });
  } catch {
    // Keep ordinary login usable. Protected callers must require a valid App Check token.
    // Do not log exception details: native errors may contain device/token information.
    console.warn('App Check belum tersedia. Pastikan development build sudah diperbarui.');
  }

  return appCheck;
}
