import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { AppButton } from '@/components/ui/app-button';

type PresensiBerhasilSheetProps = {
    visible: boolean;
    berhasil: boolean;
    judul: string;
    pesan: string;
    waktuPresensi?: string;
    onClose: () => void;
};

export function PresensiBerhasilSheet({
    visible,
    berhasil,
    judul,
    pesan,
    waktuPresensi,
    onClose,
}: PresensiBerhasilSheetProps) {
    const warnaStatus = berhasil ? Colors.light.success : Colors.light.danger;
    const latarStatus = berhasil ? Colors.light.successSoft : Colors.light.dangerSoft;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Tutup informasi presensi"
                    style={StyleSheet.absoluteFill}
                    onPress={onClose}
                />

                <View style={styles.sheet}>
                    <View style={[styles.statusIcon, { backgroundColor: latarStatus }]}>
                        <Text style={[styles.statusSymbol, { color: warnaStatus }]}>
                            {berhasil ? '✓' : '!'}
                        </Text>
                    </View>

                    <Text style={styles.title}>{judul}</Text>
                    <Text style={styles.description}>{pesan}</Text>

                    {berhasil && waktuPresensi && (
                        <View style={styles.timeCard}>
                            <Text style={styles.timeLabel}>Waktu presensi</Text>
                            <Text style={styles.timeValue}>{waktuPresensi}</Text>
                        </View>
                    )}

                    <AppButton
                        title="Mengerti"
                        onPress={onClose}
                        variant="primary"
                        size="large"
                        fullWidth
                    />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
    },
    sheet: {
        backgroundColor: Colors.light.card,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 24,
        paddingTop: 28,
        paddingBottom: 32,
        alignItems: 'center',
        gap: 14,
    },
    statusIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusSymbol: { fontSize: 32, fontWeight: '700' },
    title: {
        color: Colors.light.text,
        fontSize: 21,
        fontWeight: '700',
        textAlign: 'center',
    },
    description: {
        color: Colors.light.textSecondary,
        fontSize: 14,
        lineHeight: 21,
        textAlign: 'center',
    },
    timeCard: {
        width: '100%',
        backgroundColor: Colors.light.background,
        borderRadius: 14,
        padding: 14,
        gap: 5,
        alignItems: 'center',
    },
    timeLabel: { color: Colors.light.textSecondary, fontSize: 12 },
    timeValue: { color: Colors.light.text, fontSize: 16, fontWeight: '700' },
});
