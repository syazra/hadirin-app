import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { IzinAsistenItem } from '@/components/asisten/izin-asisten-item';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useIzinAsisten } from '@/hooks/use-izin-asisten';

export default function IzinAsistenScreen() {
    const router = useRouter();
    const { pengguna } = useAuth();
    const { izin, loading, error } = useIzinAsisten(pengguna?.uid ?? null);

    if (loading && izin.length === 0) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.light.primary} />
                <Text style={styles.muted}>Memuat pengajuan izin...</Text>
            </View>
        );
    }

    if (error && izin.length === 0) {
        return (
            <View style={styles.center}>
                <Text style={styles.error}>Gagal memuat pengajuan izin</Text>
                <Text style={styles.muted}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <Text style={styles.title}>Pengajuan Izin</Text>
            <Text style={styles.subtitle}>Daftar izin praktikan dari kelas yang kamu ampu.</Text>
            {error && (
                <Text style={styles.error}>{error}</Text>
            )}
            {loading && (
                <Text style={styles.muted}>Memuat data kelas lainnya...</Text>
            )}
            <FlatList
                data={izin}
                keyExtractor={(item) => item.idIzin}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <IzinAsistenItem
                        izin={item}
                        onPress={() => router.push({ pathname: '/izin/[id]', params: { id: item.idIzin } })}
                    />
                )}
                ListEmptyComponent={<Text style={styles.empty}>Belum ada pengajuan izin.</Text>}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.light.background, padding: Spacing.three },
    title: { color: Colors.light.text, fontSize: 23, fontWeight: '700' },
    subtitle: { color: Colors.light.textSecondary, fontSize: 12, marginTop: 5, marginBottom: 16 },
    list: { gap: 12, paddingBottom: 24 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20 },
    muted: { color: Colors.light.textSecondary, textAlign: 'center' },
    error: { color: Colors.light.danger, fontWeight: '700' },
    empty: { color: Colors.light.textSecondary, textAlign: 'center', marginTop: 40 },
});