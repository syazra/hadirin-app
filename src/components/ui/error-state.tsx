import { Colors } from '@/constants/theme';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

type ErrorStateProps = {
    judul?: string;
    /** Pesan penyebab error yang mudah dipahami pengguna. */
    pesan?: string;
    /** Jika diisi, menampilkan tombol untuk memuat ulang. */
    onCobaLagi?: () => void;
    labelTombol?: string;
    /** true saat proses coba lagi sedang berjalan. */
    sedangMencoba?: boolean;
    /** true: mengisi seluruh layar (default). false: ringkas, untuk di dalam kartu atau daftar. */
    layarPenuh?: boolean;
};

export function ErrorState({
    judul = 'Gagal memuat data',
    pesan = 'Terjadi gangguan koneksi atau layanan. Silakan coba lagi.',
    onCobaLagi,
    labelTombol = 'Coba lagi',
    sedangMencoba = false,
    layarPenuh = true,
}: ErrorStateProps) {
    return (
        <View
            style={[styles.wadah, layarPenuh ? styles.layarPenuh : styles.ringkas]}
            accessible
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
        >
            <Text style={styles.judul}>{judul}</Text>
            <Text style={styles.pesan}>{pesan}</Text>

            {onCobaLagi ? (
                <Pressable
                    onPress={onCobaLagi}
                    disabled={sedangMencoba}
                    accessibilityRole="button"
                    accessibilityLabel={sedangMencoba ? 'Sedang mencoba lagi' : labelTombol}
                    accessibilityState={{ disabled: sedangMencoba, busy: sedangMencoba }}
                    style={({ pressed }) => [
                        styles.tombol,
                        sedangMencoba && styles.tombolNonaktif,
                        pressed && !sedangMencoba && styles.ditekan,
                    ]}
                >
                    {sedangMencoba ? (
                        <ActivityIndicator
                            size="small"
                            color={Colors.light.backgroundElement}
                        />
                    ) : (
                        <Text style={styles.tombolTeks}>{labelTombol}</Text>
                    )}
                </Pressable>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wadah: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 24,
    },
    layarPenuh: {
        flex: 1,
    },
    ringkas: {
        paddingVertical: 24,
    },
    judul: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.light.text,
        textAlign: 'center',
    },
    pesan: {
        fontSize: 14,
        lineHeight: 20,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        marginBottom: 8,
    },
    tombol: {
        minHeight: 44,
        minWidth: 128,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: Colors.light.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tombolNonaktif: {
        opacity: 0.6,
    },
    ditekan: {
        opacity: 0.75,
    },
    tombolTeks: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.backgroundElement,
    },
});