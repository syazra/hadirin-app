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
    const [modalVisible, setModalVisible] = useState(visible);
    const [prevVisible, setPrevVisible] = useState(visible);
    const [anim] = useState(() => new Animated.Value(visible ? 1 : 0));

    if (visible !== prevVisible) {
        setPrevVisible(visible);
        if (visible) {
            setModalVisible(true);
        }
    }

    const jalankanAnimasiMasuk = () => {
        anim.setValue(0);
        Animated.timing(anim, {
            toValue: 1,
            duration: 240,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
        onSetelahTampil?.();
    };

    useEffect(() => {
        if (!visible && modalVisible) {
            Animated.timing(anim, {
                toValue: 0,
                duration: 180,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }).start(({ finished }) => {
                if (finished) {
                    setModalVisible(false);
                }
            });
        }
    }, [visible, modalVisible, anim]);

    const backdropOpacity = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.45],
    });

    const sheetTranslateY = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [320, 0],
    });

    const tutup = () => {
        if (!nonaktifTutup) {
            onTutup();
        }
    };

    const konten = (
        <View style={styles.overlay}>
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    styles.backdrop,
                    { opacity: backdropOpacity },
                ]}
            >
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={tutup}
                    disabled={nonaktifTutup}
                    accessibilityRole="button"
                    accessibilityLabel={accessibilityLabelTutup}
                    accessibilityState={{ disabled: nonaktifTutup }}
                />
            </Animated.View>

            <Animated.View
                style={[
                    styles.sheet,
                    {
                        paddingBottom: Math.max(insets.bottom, 16) + 12,
                        transform: [{ translateY: sheetTranslateY }],
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
            visible={modalVisible}
            transparent
            animationType="none"
            onShow={jalankanAnimasiMasuk}
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