import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Colors } from '@/constants/theme';
import { formatWaktu } from '@/utils/format-waktu';

type PresensiBerhasilSheetProps = {
    visible: boolean;
    berhasil: boolean;
    judul: string;
    pesan: string;
    waktuPresensi?: Date | string | null;
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
    const latarStatus = berhasil
        ? Colors.light.successSoft
        : Colors.light.dangerSoft;

    const teksWaktu = (() => {
        if (!waktuPresensi) return null;
        if (waktuPresensi instanceof Date) {
            return formatWaktu(waktuPresensi);
        }
        const hasilFormat = formatWaktu(waktuPresensi);
        return hasilFormat === '-' && waktuPresensi.trim() !== '-'
            ? waktuPresensi
            : hasilFormat;
    })();

    return (
        <BottomSheet
            visible={visible}
            onTutup={onClose}
            accessibilityLabelTutup="Tutup informasi presensi"
        >
            <View style={styles.content}>
                <View
                    style={[
                        styles.statusIcon,
                        { backgroundColor: latarStatus },
                    ]}
                >
                    <Text
                        style={[styles.statusSymbol, { color: warnaStatus }]}
                    >
                        {berhasil ? '✓' : '!'}
                    </Text>
                </View>

                <Text style={styles.title}>{judul}</Text>
                <Text style={styles.description}>{pesan}</Text>

                {berhasil && teksWaktu && (
                    <View style={styles.timeCard}>
                        <Text style={styles.timeLabel}>Waktu presensi</Text>
                        <Text style={styles.timeValue}>
                            {teksWaktu}
                        </Text>
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
        </BottomSheet>
    );
}

const styles = StyleSheet.create({
    content: {
        paddingTop: 8,
        paddingBottom: 4,
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
    statusSymbol: {
        fontSize: 32,
        fontWeight: '700',
    },
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
    timeLabel: {
        color: Colors.light.textSecondary,
        fontSize: 12,
    },
    timeValue: {
        color: Colors.light.text,
        fontSize: 16,
        fontWeight: '700',
    },
});