import { StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { useNotifications } from '@/context/notification-context';
import { AppButton } from '@/components/ui/app-button';
import { Colors, Fonts } from '@/constants/theme';

export function NotificationSettings() {
    const { status, activate, settings } = useNotifications();
    const [requesting, setRequesting] = useState(false);
    const enable = async () => {
        setRequesting(true);
        try { await activate(); } finally { setRequesting(false); }
    };
    const labels = { UNSUPPORTED: 'Notifikasi saat ini tersedia pada build Android.', DISABLED: 'Notifikasi belum aktif.',
        REGISTERING: 'Menyiapkan notifikasi…', READY: 'Notifikasi aktif pada perangkat ini.',
        ERROR: 'Perangkat belum terdaftar. Periksa koneksi dan coba lagi.' };
    return <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>Notifikasi</Text>
        <Text style={styles.body}>Terima info sesi dibuka, perubahan jadwal, dan hasil pengajuan izin.</Text>
        <Text accessibilityLiveRegion="polite" style={styles.body}>{labels[status]}</Text>
        {status !== 'UNSUPPORTED' && <>
            {status !== 'READY' && <AppButton title={status === 'ERROR' ? 'Coba lagi' : 'Aktifkan notifikasi'}
                loading={requesting || status === 'REGISTERING'} onPress={() => { void enable(); }} />}
            <AppButton title="Pengaturan notifikasi" variant="outline" disabled={requesting} onPress={() => { void settings(); }} />
        </>}
    </View>;
}
const styles = StyleSheet.create({
    card: { gap: 12, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: Colors.light.border, backgroundColor: Colors.light.card },
    title: { fontFamily: Fonts.sansBold, fontSize: 16, color: Colors.light.text },
    body: { fontFamily: Fonts.sans, color: Colors.light.textSecondary },
});
