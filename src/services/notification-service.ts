import { Linking, PermissionsAndroid, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { getId } from '@react-native-firebase/installations';
import { deleteToken, getToken, hasPermission, setAutoInitEnabled } from '@react-native-firebase/messaging';
import { doc, getDocFromServer, runTransaction, serverTimestamp } from '@react-native-firebase/firestore';
import { getFirebaseNativeServices, getFirebaseServices, isFirebaseAvailable } from '@/lib/firebase';
import { NotificationRegistration } from './notification-registration';
import type { PushPayload } from '@/utils/notification-routing';

const OWNER_KEY = 'push.registryOwner.v1';
const ASKED_KEY = 'push.permissionAsked.v1';
const SEEN_KEY = 'push.seen.v1';
const supported = isFirebaseAvailable && Platform.OS === 'android';

export async function notificationPermission(): Promise<boolean> {
    if (!supported) return false;
    const status = await withNotificationTimeout(hasPermission(getFirebaseNativeServices().messaging));
    return status === 1 || status === 2;
}

export function withNotificationTimeout<T>(operation: Promise<T>, milliseconds = 12_000): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Notification operation timed out')), milliseconds);
        operation.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
    });
}

export const notificationRegistration = new NotificationRegistration({
    supported,
    currentUid: () => supported ? getFirebaseServices().auth.currentUser?.uid ?? null : null,
    permission: notificationPermission,
    readOwner: () => SecureStore.getItemAsync(OWNER_KEY),
    saveOwner: uid => SecureStore.setItemAsync(OWNER_KEY, uid),
    rotateToken: async () => {
        const { messaging } = getFirebaseNativeServices();
        await withNotificationTimeout(setAutoInitEnabled(messaging, false));
        await withNotificationTimeout(deleteToken(messaging));
    },
    installation: () => withNotificationTimeout(getId(getFirebaseNativeServices().installations)),
    token: async () => {
        // Enable refresh only after permission, authentication and owner rotation.
        const { messaging } = getFirebaseNativeServices();
        await withNotificationTimeout(setAutoInitEnabled(messaging, true));
        return withNotificationTimeout(getToken(messaging));
    },
    register: async (uid, installation, token) => {
        const { auth, db } = getFirebaseServices();
        const ref = doc(db, 'pengguna', uid, 'perangkat', installation);
        await withNotificationTimeout(runTransaction(db, async tx => {
            const old = await tx.get(ref);
            if (auth.currentUser?.uid !== uid) throw new Error('Account changed');
            tx.set(ref, { fcmToken: token, platform: 'android',
                dibuatPada: old.data()?.dibuatPada ?? serverTimestamp(), diperbaruiPada: serverTimestamp() });
        }));
    },
    remove: async (uid, installation) => {
        const { auth, db } = getFirebaseServices();
        const ref = doc(db, 'pengguna', uid, 'perangkat', installation);
        await withNotificationTimeout(runTransaction(db, async tx => {
            await tx.get(ref);
            if (auth.currentUser?.uid !== uid) throw new Error('Account changed');
            tx.delete(ref);
        }));
    },
});

let permissionAction: Promise<void> | null = null;
export function notificationPermissionAction(): Promise<void> {
    if (!permissionAction) permissionAction = requestNotificationPermission().finally(() => { permissionAction = null; });
    return permissionAction;
}

async function requestNotificationPermission(): Promise<void> {
    if (!supported) return;
    if (await notificationPermission()) { await notificationRegistration.sync(); return; }
    const asked = await SecureStore.getItemAsync(ASKED_KEY);
    if (asked || Number(Platform.Version) < 33) { await Linking.openSettings(); return; }
    await SecureStore.setItemAsync(ASKED_KEY, 'true');
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS, {
        title: 'Notifikasi Hadir.in', message: 'Terima pengingat sesi, perubahan jadwal, dan hasil pengajuan izin.',
        buttonPositive: 'Lanjutkan', buttonNegative: 'Nanti',
    });
    await notificationRegistration.sync();
}

export async function openNotificationSettings(): Promise<void> {
    if (supported) await Linking.openSettings();
}

let seenQueue: Promise<unknown> = Promise.resolve();
/** Separate presentation and navigation dedupe; tapping a displayed banner must still work. */
export function claimNotification(payload: PushPayload, phase: 'shown' | 'opened'): Promise<boolean> {
    const work = seenQueue.then(async () => {
        if (!supported) return false;
        const key = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,
            `${payload.recipientUid}:${payload.eventId}:${phase}`);
        let recent: string[] = [];
        try {
            const value: unknown = JSON.parse(await SecureStore.getItemAsync(SEEN_KEY) ?? '[]');
            if (Array.isArray(value)) recent = value.filter((v): v is string => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v));
        } catch { /* A damaged local cache can be rebuilt; no server data is affected. */ }
        if (recent.includes(key)) return false;
        await SecureStore.setItemAsync(SEEN_KEY, JSON.stringify([...recent.slice(-23), key]));
        return true;
    });
    seenQueue = work.catch(() => undefined);
    return work;
}

export const notificationAccess = {
    async read(collection: 'sesi' | 'izin' | 'kelas' | 'keanggotaan', id: string) {
        const snapshot = await withNotificationTimeout(getDocFromServer(doc(getFirebaseServices().db, collection, id)));
        return snapshot.exists() ? snapshot.data() ?? null : null;
    },
};

/** Notification failure cannot prevent signing out. A new account must rotate again. */
export async function unregisterNotificationsBeforeLogout(): Promise<void> {
    if (!supported) return;
    try { await withNotificationTimeout(notificationRegistration.disconnect(), 8000); } catch { /* Best effort; owner marker forces rotation next login. */ }
}

export function restoreNotificationsAfterLogoutFailure(): void {
    if (!supported) return;
    const uid = getFirebaseServices().auth.currentUser?.uid ?? null;
    void notificationRegistration.connect(null);
    void notificationRegistration.connect(uid);
}
