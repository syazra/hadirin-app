import {
    Modal,
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
                    style={StyleSheet.absoluteFill}
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
        backgroundColor: 'rgba(17, 24, 39, 0.45)',
    },
    sheet: {
        backgroundColor: '#FFFFFF',
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
        backgroundColor: '#D1D5DB',
        marginBottom: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    message: {
        fontSize: 14,
        lineHeight: 21,
        color: '#6B7280',
        marginBottom: 4,
    },
    confirmButton: {
        minHeight: 48,
        borderRadius: 12,
        backgroundColor: '#2563EB',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    confirmText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    cancelButton: {
        minHeight: 48,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    cancelText: {
        color: '#374151',
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
