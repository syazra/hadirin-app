import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Colors } from '@/constants/theme';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

type ConfirmSheetProps = {
    visible: boolean;
    judul: string;
    pesan: string;
    onKonfirmasi: () => void;
    onBatal: () => void;
    labelKonfirmasi?: string;
    labelBatal?: string;
    loading?: boolean;
    disabled?: boolean;
    labelLoading?: string;
};

export function ConfirmSheet({
    visible,
    judul,
    pesan,
    onKonfirmasi,
    onBatal,
    labelKonfirmasi = 'Ya, lanjutkan',
    labelBatal = 'Batal',
    loading = false,
    disabled = false,
    labelLoading = 'Memproses...',
}: ConfirmSheetProps) {
    const konfirmasiNonaktif = loading || disabled;

    return (
        <BottomSheet
            visible={visible}
            onTutup={onBatal}
            nonaktifTutup={loading}
            accessibilityLabelTutup="Tutup konfirmasi"
        >
            <View style={styles.konten}>
                <Text style={styles.title}>{judul}</Text>
                <Text style={styles.message}>{pesan}</Text>

                <Pressable
                    onPress={onKonfirmasi}
                    disabled={konfirmasiNonaktif}
                    accessibilityRole="button"
                    accessibilityLabel={loading ? labelLoading : labelKonfirmasi}
                    accessibilityState={{ disabled: konfirmasiNonaktif, busy: loading }}
                    style={({ pressed }) => [
                        styles.confirmButton,
                        pressed && !konfirmasiNonaktif && styles.pressed,
                        konfirmasiNonaktif && styles.disabled,
                    ]}
                >
                    {loading ? (
                        <View style={styles.loadingRow}>
                            <ActivityIndicator
                                size="small"
                                color={Colors.light.backgroundElement}
                            />
                            <Text style={styles.confirmText}>{labelLoading}</Text>
                        </View>
                    ) : (
                        <Text style={styles.confirmText}>{labelKonfirmasi}</Text>
                    )}
                </Pressable>

                <Pressable
                    onPress={onBatal}
                    disabled={loading}
                    accessibilityRole="button"
                    accessibilityLabel={labelBatal}
                    accessibilityState={{ disabled: loading }}
                    style={({ pressed }) => [
                        styles.cancelButton,
                        pressed && !loading && styles.pressed,
                        loading && styles.disabled,
                    ]}
                >
                    <Text style={styles.cancelText}>{labelBatal}</Text>
                </Pressable>
            </View>
        </BottomSheet>
    );
}

const styles = StyleSheet.create({
    konten: {
        gap: 14,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.light.text,
    },
    message: {
        fontSize: 14,
        lineHeight: 21,
        color: Colors.light.textSecondary,
        marginBottom: 4,
    },
    confirmButton: {
        minHeight: 48,
        borderRadius: 12,
        backgroundColor: Colors.light.primary,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    confirmText: {
        color: Colors.light.backgroundElement,
        fontSize: 15,
        fontWeight: '700',
    },
    cancelButton: {
        minHeight: 48,
        borderRadius: 12,
        backgroundColor: Colors.light.background,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    cancelText: {
        color: Colors.light.text,
        fontSize: 15,
        fontWeight: '600',
    },
    pressed: {
        opacity: 0.75,
    },
    disabled: {
        opacity: 0.6,
    },
});