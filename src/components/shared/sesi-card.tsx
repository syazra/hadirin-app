import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/app-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Colors } from '@/constants/theme';
import type { Sesi } from '@/types';

type SesiCardProps = {
    sesi: Sesi;
    namaPraktikum?: string;
    onPress: () => void;
};

function formatJam(tanggal: Date): string {
    const jam = String(tanggal.getHours()).padStart(2, '0');
    const menit = String(tanggal.getMinutes()).padStart(2, '0');
    return `${jam}.${menit}`;
}

function formatRentangWaktu(
    waktuMulai: Date,
    waktuSelesai: Date | null,
): string {
    const tanggal = waktuMulai.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

    const jamMulai = formatJam(waktuMulai);
    if (!waktuSelesai) {
        return `${tanggal} • ${jamMulai} WIB`;
    }

    return `${tanggal} • ${jamMulai}–${formatJam(waktuSelesai)} WIB`;
}

export function SesiCard({
    sesi,
    namaPraktikum,
    onPress,
}: SesiCardProps) {
    const waktuTampil = formatRentangWaktu(
        sesi.waktuMulai,
        sesi.waktuSelesai,
    );

    return (
        <AppCard onPress={onPress}>
            <View style={styles.header}>
                <View style={styles.info}>
                    {namaPraktikum ? (
                        <Text style={styles.kelas}>{namaPraktikum}</Text>
                    ) : null}
                    <Text style={styles.nama}>{sesi.judul}</Text>
                    <Text style={styles.lokasi}>{sesi.lokasi}</Text>
                </View>

                <StatusBadge status={sesi.statusSesi} />
            </View>

            <View style={styles.footer}>
                <Text style={styles.icon}>◷</Text>
                <Text style={styles.waktu}>{waktuTampil}</Text>
                <View style={styles.spacer} />
                <Text style={styles.detail}>Lihat detail ›</Text>
            </View>
        </AppCard>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
    },
    info: {
        flex: 1,
        gap: 4,
    },
    kelas: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.light.primary,
    },
    nama: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.light.text,
    },
    lokasi: {
        fontSize: 14,
        color: Colors.light.textSecondary,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingTop: 4,
    },
    icon: {
        fontSize: 18,
        color: Colors.light.textSecondary,
    },
    waktu: {
        fontSize: 13,
        color: Colors.light.textSecondary,
        flexShrink: 1,
    },
    spacer: {
        flex: 1,
    },
    detail: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.light.primary,
    },
});