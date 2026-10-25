
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { Colors } from '@/constants/theme';

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
                    style={[StyleSheet.absoluteFill, styles.backdrop]}
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
                        <Text style={styles.closeText}>
                            {labelTutup}
                        </Text>
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
    infoIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.light.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoIconText: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.light.primary,
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
    closeButton: {
        minHeight: 48,
        borderRadius: 12,
        backgroundColor: Colors.light.primary,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    closeText: {
        color: Colors.light.backgroundElement,
        fontSize: 15,
        fontWeight: '700',
    },
    pressed: {
        opacity: 0.75,
    },
});
