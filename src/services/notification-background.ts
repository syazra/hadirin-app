import { Platform } from 'react-native';
import { setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import { getFirebaseNativeServices } from '@/lib/firebase';
import { parsePushPayload } from '@/utils/notification-routing';
import { claimNotification } from '@/services/notification-service';

// Installed before Expo Router. Android/FCM displays notification messages itself.
// Never render, navigate, or sign in from the headless/background handler.
if (Platform.OS === 'android') {
    try {
        setBackgroundMessageHandler(getFirebaseNativeServices().messaging, async message => {
            const payload = parsePushPayload(message.data);
            if (!payload) return;
            try { await claimNotification(payload, 'shown'); } catch { /* OS presentation does not depend on local storage. */ }
        });
    } catch {
        console.warn('Notifikasi belum tersedia pada build ini.');
    }
}
