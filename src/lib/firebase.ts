
import { Platform } from 'react-native';

import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';

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

    return {
        app,
        auth: getAuth(app),
        db: getFirestore(app),
    };
}
