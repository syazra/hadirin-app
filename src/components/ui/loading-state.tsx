import { Colors } from '@/constants/theme';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

type LoadingStateProps = {
    /** Teks di bawah indikator. Sebutkan apa yang dimuat, mis. "Memuat kelas…". */
    pesan?: string;
    /** true: mengisi seluruh layar (default). false: ringkas, untuk di dalam kartu atau daftar. */
    layarPenuh?: boolean;
};

export function LoadingState({
    pesan = 'Memuat data…',
    layarPenuh = true,
}: LoadingStateProps) {
    return (
        <View
            style={[styles.wadah, layarPenuh ? styles.layarPenuh : styles.ringkas]}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={pesan}
            accessibilityLiveRegion="polite"
        >
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={styles.pesan}>{pesan}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    wadah: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingHorizontal: 24,
    },
    layarPenuh: {
        flex: 1,
    },
    ringkas: {
        paddingVertical: 24,
    },
    pesan: {
        fontSize: 14,
        lineHeight: 20,
        color: Colors.light.textSecondary,
        textAlign: 'center',
    },
});