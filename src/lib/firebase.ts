import { Platform } from 'react-native';

import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';
import { getInstallations } from '@react-native-firebase/installations';
import { getMessaging } from '@react-native-firebase/messaging';

import { prepareAndroidAppCheck } from '@/lib/firebase-app-check';

// Firebase hanya diaktifkan untuk Android pada Sprint 2.
export const isFirebaseAvailable = Platform.OS === 'android';

export function getFirebaseServices() {
    if (!isFirebaseAvailable) {
        throw new Error(
            'Firebase Hadir.in saat ini hanya tersedia di Android.',
        );
    }

    // Android menggunakan Firebase App yang sudah
    // diinisialisasi secara native melalui google-services.json.
    const app = getApp();
    const appCheck = prepareAndroidAppCheck(app);

    return {
        app,
        auth: getAuth(app),
        db: getFirestore(app),
        appCheck,
    };
}

/** Android-only native accessors. No token request, permission prompt, or registration. */
export function getFirebaseNativeServices() {
    const { app, appCheck } = getFirebaseServices();
    return {
        appCheck,
        installations: getInstallations(app),
        messaging: getMessaging(app),
    };
}
