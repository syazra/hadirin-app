import { Colors } from '@/constants/theme';
import type { Kelas } from '@/types';
import { formatWaktu } from '@/utils/format-waktu';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type KelasCardProps = {
    kelas: Kelas;
    onPress: () => void;
    onEdit?: () => void;
    onArsip?: () => void;
};

export function KelasCard({
    kelas,
    onPress,
    onEdit,
    onArsip,
}: KelasCardProps) {
    const diarsipkan = kelas.diarsipkan;

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`Buka detail kelas ${kelas.namaPraktikum}`}
            style={({ pressed }) => [
                styles.kartu,
                diarsipkan && styles.kartuDiarsipkan,
                pressed && styles.ditekan,
            ]}
        >
            <View style={styles.barisAtas}>
                <Text style={styles.nama} numberOfLines={2}>
                    {kelas.namaPraktikum}
                </Text>

                <View
                    style={[
                        styles.badge,
                        diarsipkan ? styles.badgeArsip : styles.badgeAktif,
                    ]}
                >
                    <Text
                        style={[
                            styles.badgeTeks,
                            diarsipkan
                                ? styles.badgeTeksArsip
                                : styles.badgeTeksAktif,
                        ]}
                    >
                        {diarsipkan ? 'Diarsipkan' : 'Aktif'}
                    </Text>
                </View>
            </View>

            <Text style={styles.meta}>
                Dibuat:{' '}
                {kelas.dibuatPada
                    ? formatWaktu(kelas.dibuatPada.toISOString())
                    : 'Memproses…'}
            </Text>

            <View style={styles.barisAksi}>
                <Text style={styles.petunjuk}>
                    Ketuk untuk kelola peserta & sesi
                </Text>

                {!diarsipkan && (onEdit || onArsip) ? (
                    <View style={styles.grupTombol}>
                        {onEdit ? (
                            <Pressable
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onEdit();
                                }}
                                hitSlop={8}
                                accessibilityRole="button"
                                accessibilityLabel={`Ubah kelas ${kelas.namaPraktikum}`}
                                style={({ pressed }) => [
                                    styles.tombolAksi,
                                    styles.tombolEdit,
                                    pressed && styles.ditekan,
                                ]}
                            >
                                <Text style={styles.tombolEditTeks}>Ubah</Text>
                            </Pressable>
                        ) : null}

                        {onArsip ? (
                            <Pressable
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onArsip();
                                }}
                                hitSlop={8}
                                accessibilityRole="button"
                                accessibilityLabel={`Arsipkan kelas ${kelas.namaPraktikum}`}
                                style={({ pressed }) => [
                                    styles.tombolAksi,
                                    styles.tombolArsip,
                                    pressed && styles.ditekan,
                                ]}
                            >
                                <Text style={styles.tombolArsipTeks}>
                                    Arsipkan
                                </Text>
                            </Pressable>
                        ) : null}
                    </View>
                ) : null}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    kartu: {
        backgroundColor: Colors.light.backgroundElement,
        borderWidth: 1,
        borderColor: Colors.light.border,
        borderRadius: 14,
        padding: 16,
        gap: 8,
    },
    kartuDiarsipkan: {
        opacity: 0.75,
        backgroundColor: Colors.light.background,
    },
    ditekan: {
        opacity: 0.75,
    },
    barisAtas: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 10,
    },
    nama: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        lineHeight: 22,
        color: Colors.light.text,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    badgeAktif: {
        backgroundColor: '#E6F4FE',
    },
    badgeArsip: {
        backgroundColor: Colors.light.border,
    },
    badgeTeks: {
        fontSize: 12,
        fontWeight: '600',
    },
    badgeTeksAktif: {
        color: Colors.light.primary,
    },
    badgeTeksArsip: {
        color: Colors.light.textSecondary,
    },
    meta: {
        fontSize: 13,
        color: Colors.light.textSecondary,
    },
    barisAksi: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        marginTop: 4,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: Colors.light.border,
    },
    petunjuk: {
        flex: 1,
        fontSize: 12,
        color: Colors.light.textSecondary,
    },
    grupTombol: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    tombolAksi: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    tombolEdit: {
        backgroundColor: Colors.light.background,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    tombolEditTeks: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.light.text,
    },
    tombolArsip: {
        backgroundColor: '#FEE2E2',
    },
    tombolArsipTeks: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.light.danger,
    },
});