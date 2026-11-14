import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/app-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Colors } from '@/constants/theme';
import type { Sesi } from '@/types';

type DetailSesiProps = {
    sesi: Sesi;
    namaPraktikum?: string;
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

export function DetailSesi({
    sesi,
    namaPraktikum,
}: DetailSesiProps) {
    const waktuTampil = formatRentangWaktu(
        sesi.waktuMulai,
        sesi.waktuSelesai,
    );

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Detail Praktikum</Text>

            <AppCard>
                <View style={styles.titleBlock}>
                    {namaPraktikum ? (
                        <Text style={styles.kelas}>{namaPraktikum}</Text>
                    ) : null}
                    <Text style={styles.nama}>{sesi.judul}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Lokasi</Text>
                    <Text style={styles.value}>{sesi.lokasi}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Waktu Praktikum</Text>
                    <Text style={styles.value}>{waktuTampil}</Text>
                </View>

                <View style={styles.statusSection}>
                    <Text style={styles.label}>Status Sesi</Text>
                    <View style={styles.statusRow}>
                        <StatusBadge status={sesi.statusSesi} />
                        {sesi.diarsipkan ? (
                            <View style={styles.arsipBadge}>
                                <Text style={styles.arsipBadgeText}>
                                    Diarsipkan
                                </Text>
                            </View>
                        ) : null}
                    </View>
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
    titleBlock: {
        gap: 4,
    },
    kelas: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.light.primary,
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
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    arsipBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: Colors.light.backgroundSelected,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    arsipBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.light.textSecondary,
    },
});