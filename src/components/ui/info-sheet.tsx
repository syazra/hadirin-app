import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

type InfoSheetProps = {
    visible: boolean;
    judul: string;
    pesan: string;
    onTutup: () => void;
    labelTutup?: string;
};

export function InfoSheet({
    visible,
    judul,
    pesan,
    onTutup,
    labelTutup = 'Mengerti',
}: InfoSheetProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onTutup}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={onTutup}
                    accessibilityRole="button"
                    accessibilityLabel="Tutup informasi"
                />

                <View
                    style={styles.sheet}
                    accessibilityViewIsModal
                >
                    <View style={styles.handle} />

                    <View style={styles.infoIcon}>
                        <Text style={styles.infoIconText}>i</Text>
                    </View>

                    <Text style={styles.title}>{judul}</Text>
                    <Text style={styles.message}>{pesan}</Text>

                    <Pressable
                        onPress={onTutup}
                        accessibilityRole="button"
                        style={({ pressed }) => [
                            styles.closeButton,
                            pressed && styles.pressed,
                        ]}
                    >
                        <Text style={styles.closeText}>{labelTutup}</Text>
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
    infoIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#DBEAFE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoIconText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1D4ED8',
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
    closeButton: {
        minHeight: 48,
        borderRadius: 12,
        backgroundColor: '#2563EB',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    closeText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    pressed: {
        opacity: 0.75,
    },
});
