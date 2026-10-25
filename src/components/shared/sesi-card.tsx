
import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/app-card';
import { StatusBadge } from '@/components/ui/status-badge';

type StatusSesi = 'BELUM_DIBUKA' | 'DIBUKA' | 'DITUTUP';

type SesiCardProps = {
    namaPraktikum: string;
    kelasLab: string;
    waktu: string;
    statusSesi: StatusSesi;
    onPress: () => void;
};

export function SesiCard({
    namaPraktikum,
    kelasLab,
    waktu,
    statusSesi,
    onPress,
}: SesiCardProps) {
    return (
        <AppCard onPress={onPress}>
            <View style={styles.header}>
                <View style={styles.info}>
                    <Text style={styles.nama}>{namaPraktikum}</Text>
                    <Text style={styles.lokasi}>{kelasLab}</Text>
                </View>

                <StatusBadge status={statusSesi} />
            </View>

            <View style={styles.footer}>
                <Text style={styles.icon}>◷</Text>
                <Text style={styles.waktu}>{waktu}</Text>
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
        gap: 6,
    },
    nama: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    lokasi: {
        fontSize: 14,
        color: '#6B7280',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingTop: 4,
    },
    icon: {
        fontSize: 18,
        color: '#6B7280',
    },
    waktu: {
        fontSize: 13,
        color: '#4B5563',
        flexShrink: 1,
    },
    spacer: {
        flex: 1,
    },
    detail: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4F46E5',
    },
});
