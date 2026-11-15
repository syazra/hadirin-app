import { useRouter } from 'expo-router';
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { JadwalList } from '@/components/shared/jadwal-list';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useJadwalPraktikan } from '@/hooks/use-jadwal-praktikan';

export default function JadwalPraktikanScreen() {
    const router = useRouter();
    const { pengguna, loading: authLoading } = useAuth();
    const {
        sesi,
        loading: jadwalLoading,
        error,
        muatUlang,
    } = useJadwalPraktikan(pengguna?.uid ?? null);

    const sedangMemuat = authLoading || jadwalLoading;
    const sapaan = pengguna?.nama
        ? `Halo, ${pengguna.nama}!`
        : 'Halo, Praktikan!';

    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl
                    refreshing={false}
                    onRefresh={muatUlang}
                    tintColor={Colors.light.primary}
                />
            }
        >
            <View style={styles.header}>
                <Text style={styles.greeting}>{sapaan}</Text>
                <Text style={styles.title}>Jadwal Praktikum</Text>
                <Text style={styles.description}>
                    Lihat jadwal dan status sesi praktikum kamu.
                </Text>
            </View>

            {sedangMemuat ? (
                <View style={styles.stateBox}>
                    <ActivityIndicator
                        size="large"
                        color={Colors.light.primary}
                    />
                    <Text style={styles.stateText}>
                        Memuat jadwal praktikum...
                    </Text>
                </View>
            ) : error ? (
                <View style={styles.errorBox}>
                    <Text style={styles.errorTitle}>
                        Gagal Memuat Jadwal
                    </Text>
                    <Text style={styles.errorMessage}>{error}</Text>
                    <Pressable
                        style={styles.retryButton}
                        onPress={muatUlang}
                    >
                        <Text style={styles.retryText}>Coba Lagi</Text>
                    </Pressable>
                </View>
            ) : (
                <JadwalList
                    sesi={sesi}
                    onPilihSesi={(idSesi) =>
                        router.push({
                            pathname: '/sesi/[id]',
                            params: { id: idSesi },
                        })
                    }
                />
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    content: {
        padding: 20,
        paddingTop: 24,
        paddingBottom: 32,
        gap: 24,
        flexGrow: 1,
    },
    header: {
        gap: 8,
    },
    greeting: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.primary,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: Colors.light.text,
    },
    description: {
        fontSize: 14,
        lineHeight: 21,
        color: Colors.light.textSecondary,
    },
    stateBox: {
        paddingVertical: 48,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    stateText: {
        fontSize: 14,
        color: Colors.light.textSecondary,
    },
    errorBox: {
        padding: 20,
        borderRadius: 16,
        backgroundColor: Colors.light.backgroundElement,
        borderWidth: 1,
        borderColor: Colors.light.border,
        gap: 10,
        alignItems: 'flex-start',
    },
    errorTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.light.text,
    },
    errorMessage: {
        fontSize: 14,
        lineHeight: 20,
        color: Colors.light.textSecondary,
    },
    retryButton: {
        marginTop: 4,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: Colors.light.primary,
    },
    retryText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});