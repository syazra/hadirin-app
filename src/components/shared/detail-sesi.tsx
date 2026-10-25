import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from '@/components/ui/app-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Colors } from '@/constants/theme';
import type { Sesi } from '@/types';

type DetailSesiProps = {
    namaPraktikum: string;
    kelasLab: string;
    waktu: string;
    statusSesi: Sesi['statusSesi'];
};

export function DetailSesi({
    namaPraktikum,
    kelasLab,
    waktu,
    statusSesi,
}: DetailSesiProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Detail Praktikum</Text>

            <AppCard>
                <Text style={styles.nama}>{namaPraktikum}</Text>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Kelas / Lab</Text>
                    <Text style={styles.value}>{kelasLab}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Waktu Praktikum</Text>
                    <Text style={styles.value}>{waktu}</Text>
                </View>

                <View style={styles.statusSection}>
                    <Text style={styles.label}>Status Sesi</Text>
                    <StatusBadge status={statusSesi} />
                </View>
            </AppCard>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 12,
    },
    heading: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.light.text,
    },
    nama: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.light.text,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.light.border,
    },
    infoRow: {
        gap: 6,
    },
    label: {
        fontSize: 13,
        color: Colors.light.textSecondary,
    },
    value: {
        fontSize: 15,
        fontWeight: '500',
        color: Colors.light.text,
    },
    statusSection: {
        gap: 8,
        alignItems: 'flex-start',
    },
});