import { Colors } from '@/constants/theme';
import { ReactNode, useEffect, useState } from 'react';
import {
    Animated,
    Easing,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type BottomSheetProps = {
    visible: boolean;
    onTutup: () => void;
    /** true saat proses simpan berjalan: backdrop dan tombol Back dikunci. */
    nonaktifTutup?: boolean;
    /** Dipanggil setelah Modal tampil di layar (cocok untuk fokus input). */
    onSetelahTampil?: () => void;
    /** Aktifkan KeyboardAvoidingView untuk sheet yang memiliki TextInput. */
    denganKeyboard?: boolean;
    accessibilityLabelTutup?: string;
    children: ReactNode;
};

export function BottomSheet({
    visible,
    onTutup,
    nonaktifTutup = false,
    onSetelahTampil,
    denganKeyboard = false,
    accessibilityLabelTutup = 'Tutup sheet',
    children,
}: BottomSheetProps) {
    const insets = useSafeAreaInsets();
    const [slideY] = useState(() => new Animated.Value(visible ? 0 : 280));

    useEffect(() => {
        slideY.stopAnimation();

        if (visible) {
            slideY.setValue(280);
            Animated.timing(slideY, {
                toValue: 0,
                duration: 220,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }).start();
        } else {
            slideY.setValue(280);
        }
    }, [visible, slideY]);

    const tutup = () => {
        if (!nonaktifTutup) {
            onTutup();
        }
    };

    const konten = (
        <View style={styles.overlay}>
            <Pressable
                style={[StyleSheet.absoluteFill, styles.backdrop]}
                onPress={tutup}
                disabled={nonaktifTutup}
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabelTutup}
                accessibilityState={{ disabled: nonaktifTutup }}
            />

            <Animated.View
                style={[
                    styles.sheet,
                    {
                        paddingBottom: Math.max(insets.bottom, 16) + 12,
                        transform: [{ translateY: slideY }],
                    },
                ]}
                accessibilityViewIsModal
            >
                <View style={styles.handle} />
                {children}
            </Animated.View>
        </View>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onShow={onSetelahTampil}
            onRequestClose={tutup}
            statusBarTranslucent
        >
            {denganKeyboard ? (
                <KeyboardAvoidingView
                    style={styles.overlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    {konten}
                </KeyboardAvoidingView>
            ) : (
                konten
            )}
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
        maxHeight: '88%',
        backgroundColor: Colors.light.card,
        paddingHorizontal: 24,
        paddingTop: 12,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    handle: {
        alignSelf: 'center',
        width: 40,
        height: 4,
        borderRadius: 999,
        backgroundColor: Colors.light.border,
        marginBottom: 16,
    },
});