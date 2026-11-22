import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useRootNavigationState } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getInitialNotification, onMessage, onNotificationOpenedApp, onTokenRefresh, type RemoteMessage } from '@react-native-firebase/messaging';
import { useAuth } from '@/hooks/use-auth';
import { getFirebaseNativeServices, getFirebaseServices, isFirebaseAvailable } from '@/lib/firebase';
import { claimNotification, notificationAccess, notificationPermission, notificationPermissionAction, notificationRegistration, openNotificationSettings } from '@/services/notification-service';
import { parsePushPayload, pushTitle, resolvePushDestination, type PushPayload } from '@/utils/notification-routing';
import type { PushStatus } from '@/services/notification-registration';
import { Colors, Fonts } from '@/constants/theme';

const NotificationContext = createContext<{ status: PushStatus; activate(): Promise<void>; settings(): Promise<void> } | null>(null);
export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('NotificationProvider is required');
    return context;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { pengguna, loading, profilBelumLengkap } = useAuth();
    const navigation = useRootNavigationState();
    const insets = useSafeAreaInsets();
    const status = useSyncExternalStore(notificationRegistration.subscribe, notificationRegistration.getSnapshot, notificationRegistration.getSnapshot);
    const [banner, setBanner] = useState<PushPayload | null>(null);
    const [pending, setPending] = useState<PushPayload | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [renderedUid, setRenderedUid] = useState(pengguna?.uid ?? null);
    const account = useRef(pengguna?.uid ?? null);
    const uid = pengguna?.uid ?? null;
    // Reset account-scoped presentation before rendering another user's screen.
    if (renderedUid !== uid) {
        setRenderedUid(uid);
        setBanner(null);
        setError(null);
        if (pending && pending.recipientUid !== uid) setPending(null);
    }
    useEffect(() => { account.current = uid; }, [uid]);

    const receive = useCallback(async (message: RemoteMessage, opened: boolean) => {
        const payload = parsePushPayload(message.data);
        if (!payload) return;
        if (opened) { setPending(payload); return; }
        if (!account.current || payload.recipientUid !== account.current) return;
        try {
            if (await notificationPermission() && await claimNotification(payload, 'shown')
                && account.current === payload.recipientUid
                && getFirebaseServices().auth.currentUser?.uid === payload.recipientUid) setBanner(payload);
        } catch { /* Presentation cache failure must not affect attendance or login. */ }
    }, []);

    useEffect(() => {
        if (!isFirebaseAvailable) return;
        let alive = true;
        const stops: (() => void)[] = [];
        try {
            const { messaging } = getFirebaseNativeServices();
            stops.push(onMessage(messaging, message => { void receive(message, false); }));
            stops.push(onNotificationOpenedApp(messaging, message => { if (alive) void receive(message, true); }));
            void getInitialNotification(messaging).then(message => {
                if (alive && message) void receive(message, true);
            }).catch(() => undefined);
        } catch { /* Registration reports native-module failure in profile. */ }
        return () => { alive = false; stops.forEach(stop => stop()); };
    }, [receive]);

    useEffect(() => {
        if (loading) return;
        const uid = !profilBelumLengkap ? pengguna?.uid ?? null : null;
        let stopped = false;
        let retry: ReturnType<typeof setTimeout> | undefined;
        let attempts = 0;
        const synchronize = async () => {
            if (stopped) return;
            await notificationRegistration.connect(uid);
            if (stopped) return;
            if (notificationRegistration.getSnapshot() === 'ERROR' && attempts < 3) {
                retry = setTimeout(() => { void synchronize(); }, [1000, 3000, 10000][attempts++]);
            }
        };
        void synchronize();
        const stops: (() => void)[] = [];
        if (isFirebaseAvailable && uid) {
            try {
                stops.push(onTokenRefresh(getFirebaseNativeServices().messaging, () => { void synchronize(); }));
            } catch { /* Build without module: expose recovery status rather than crash. */ }
            const subscription = AppState.addEventListener('change', state => {
                if (state === 'active') { if (retry) clearTimeout(retry); attempts = 0; void synchronize(); }
            });
            stops.push(() => subscription.remove());
        }
        return () => { stopped = true; if (retry) clearTimeout(retry); stops.forEach(stop => stop()); };
    }, [pengguna?.uid, loading, profilBelumLengkap]);

    useEffect(() => {
        if (!pending || loading || profilBelumLengkap || !pengguna || !navigation?.key) return;
        let cancelled = false;
        const user = pengguna;
        void (async () => {
            try {
                if (pending.recipientUid !== user.uid) return;
                const destination = await resolvePushDestination(pending, user, notificationAccess);
                if (cancelled || account.current !== user.uid || getFirebaseServices().auth.currentUser?.uid !== user.uid) return;
                if (!destination) { setError('Tujuan notifikasi sudah tidak tersedia atau tidak dapat diakses.'); return; }
                if (!await claimNotification(pending, 'opened')) return;
                if (!cancelled && account.current === user.uid && getFirebaseServices().auth.currentUser?.uid === user.uid) router.push(destination);
            } catch {
                if (!cancelled) setError('Notifikasi tidak dapat dibuka. Periksa koneksi lalu buka detail melalui jadwal atau daftar izin.');
            } finally { if (!cancelled) setPending(null); }
        })();
        return () => { cancelled = true; };
    }, [pending, pengguna, loading, profilBelumLengkap, navigation?.key]);

    useEffect(() => {
        if (!banner) return;
        const timer = setTimeout(() => setBanner(null), 8000);
        return () => clearTimeout(timer);
    }, [banner]);

    const activate = async () => {
        try { await notificationPermissionAction(); }
        catch { setError('Notifikasi belum dapat diaktifkan. Coba lagi melalui profil.'); }
    };
    const settings = async () => {
        try { await openNotificationSettings(); }
        catch { setError('Pengaturan tidak dapat dibuka. Buka pengaturan aplikasi dari perangkat.'); }
    };

    return <NotificationContext.Provider value={{ status, activate, settings }}>
        {children}
        {(banner || error) && <View style={[styles.banner, { top: insets.top + 8 }]} accessibilityLiveRegion="polite">
            {banner && <Pressable accessibilityRole="button" accessibilityLabel={`${pushTitle(banner.type)}. Buka detail`}
                style={styles.content} onPress={() => { setPending(banner); setBanner(null); }}>
                <Text style={styles.title}>{pushTitle(banner.type)}</Text>
                <Text style={styles.body}>Ketuk untuk membuka detail.</Text>
            </Pressable>}
            {error && <Text accessibilityRole="alert" style={styles.content}>{error}</Text>}
            <Pressable accessibilityRole="button" accessibilityLabel="Tutup notifikasi" style={styles.close}
                onPress={() => { setBanner(null); setError(null); }}><Text>Tutup</Text></Pressable>
        </View>}
    </NotificationContext.Provider>;
}

const styles = StyleSheet.create({
    banner: { position: 'absolute', left: 12, right: 12, zIndex: 1000, elevation: 12,
        backgroundColor: Colors.light.card, borderColor: Colors.light.primary, borderWidth: 1,
        borderRadius: 16, flexDirection: 'row', alignItems: 'center' },
    content: { flex: 1, padding: 16, color: Colors.light.text },
    title: { fontFamily: Fonts.sansBold, color: Colors.light.text, fontSize: 15 },
    body: { fontFamily: Fonts.sans, color: Colors.light.textSecondary, marginTop: 4 },
    close: { minWidth: 60, minHeight: 48, padding: 12, justifyContent: 'center' },
});
