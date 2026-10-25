import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Colors } from '@/constants/theme';

type ConfirmSheetProps = {
    visible: boolean;
    judul: string;
    pesan: string;
    onKonfirmasi: () => void;
    onBatal: () => void;
    labelKonfirmasi?: string;
    labelBatal?: string;
    loading?: boolean;
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
}: ConfirmSheetProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onBatal}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <Pressable
                    style={[StyleSheet.absoluteFill, styles.backdrop]}
                    onPress={onBatal}
                    accessibilityRole="button"
                    accessibilityLabel="Tutup konfirmasi"
                />

                <View
                    style={styles.sheet}
                    accessibilityViewIsModal
                >
                    <View style={styles.handle} />

                    <Text style={styles.title}>{judul}</Text>
                    <Text style={styles.message}>{pesan}</Text>

                    <Pressable
                        onPress={onKonfirmasi}
                        disabled={loading}
                        accessibilityRole="button"
                        style={({ pressed }) => [
                            styles.confirmButton,
                            pressed && !loading && styles.pressed,
                            loading && styles.disabled,
                        ]}
                    >
                        <Text style={styles.confirmText}>
                            {loading ? 'Memproses...' : labelKonfirmasi}
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={onBatal}
                        disabled={loading}
                        accessibilityRole="button"
                        style={({ pressed }) => [
                            styles.cancelButton,
                            pressed && !loading && styles.pressed,
                        ]}
                    >
                        <Text style={styles.cancelText}>{labelBatal}</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'transparent',
    },
    backdrop: {
        backgroundColor: Colors.light.overlay,
        opacity: 0.45,
    },
    sheet: {
        backgroundColor: Colors.light.card,
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 28,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        gap: 14,
    },
    handle: {
        alignSelf: 'center',
        width: 40,
        height: 4,
        borderRadius: 999,
        backgroundColor: Colors.light.border,
        marginBottom: 8,
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
