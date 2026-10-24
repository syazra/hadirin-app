import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { AppButton } from '@/components/ui/app-button';

type StatusSesi = 'BELUM_DIBUKA' | 'DIBUKA' | 'DITUTUP';

type PanelAksiPraktikanProps = {
    statusSesi: StatusSesi;
    sudahPresensi?: boolean;
    waktuPresensi?: string;
    onPressPresensi: () => void;
};

export function PanelAksiPraktikan({
    statusSesi,
    sudahPresensi = false,
    waktuPresensi,
    onPressPresensi,
}: PanelAksiPraktikanProps) {
    const sesiDibuka = statusSesi === 'DIBUKA';
    const presensiNonaktif = !sesiDibuka || sudahPresensi;

    const statusInfo = {
        BELUM_DIBUKA: {
            label: 'Sesi belum dibuka',
            description: 'Tunggu sampai asisten membuka sesi praktikum.',
            color: Colors.light.warning,
            backgroundColor: Colors.light.warningSoft,
        },
        DIBUKA: {
            label: 'Sesi sedang berlangsung',
            description: 'Sesi dibuka. Kamu sudah bisa melakukan presensi.',
            color: Colors.light.success,
            backgroundColor: Colors.light.successSoft,
        },
        DITUTUP: {
            label: 'Sesi sudah ditutup',
            description: 'Presensi tidak dapat dilakukan karena sesi telah ditutup.',
            color: Colors.light.danger,
            backgroundColor: Colors.light.dangerSoft,
        },
    }[statusSesi];

    let judulTombol = 'Mulai Presensi';
    let pesanPresensi = '';

    if (sudahPresensi) {
        judulTombol = 'Sudah Presensi';
        pesanPresensi = waktuPresensi
            ? `Presensi tercatat pada ${waktuPresensi}.`
            : 'Kehadiranmu sudah tercatat.';
    } else if (statusSesi === 'BELUM_DIBUKA') {
        pesanPresensi = 'Tombol presensi aktif setelah sesi dibuka.';
    } else if (statusSesi === 'DITUTUP') {
        pesanPresensi = 'Kamu tidak dapat melakukan presensi pada sesi ini.';
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Presensi Praktikum</Text>
                <Text style={styles.subtitle}>
                    Pastikan status sesi sebelum melakukan presensi.
                </Text>
            </View>

            <View style={[styles.statusCard, { backgroundColor: statusInfo.backgroundColor }]}>
                <View style={[styles.statusIndicator, { backgroundColor: statusInfo.color }]} />

                <View style={styles.statusContent}>
                    <Text style={[styles.statusTitle, { color: statusInfo.color }]}>
                        {statusInfo.label}
                    </Text>
                    <Text style={styles.statusDescription}>
                        {statusInfo.description}
                    </Text>
                </View>
            </View>

            <AppButton
                title={judulTombol}
                onPress={onPressPresensi}
                variant="primary"
                size="large"
                fullWidth
                disabled={presensiNonaktif}
            />

            {pesanPresensi !== '' && (
                <Text style={styles.helperText}>{pesanPresensi}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.light.card,
        borderColor: Colors.light.border,
        borderWidth: 1,
        borderRadius: 20,
        padding: 20,
        gap: 16,
    },
    header: { gap: 6 },
    title: { color: Colors.light.text, fontSize: 19, fontWeight: '700' },
    subtitle: { color: Colors.light.textSecondary, fontSize: 13, lineHeight: 20 },
    statusCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 14,
        borderRadius: 14,
        gap: 10,
    },
    statusIndicator: { width: 9, height: 9, borderRadius: 5, marginTop: 5 },
    statusContent: { flex: 1, gap: 4 },
    statusTitle: { fontSize: 14, fontWeight: '700' },
    statusDescription: { color: Colors.light.text, fontSize: 13, lineHeight: 19 },
    helperText: {
        color: Colors.light.textSecondary,
        fontSize: 12,
        lineHeight: 18,
        textAlign: 'center',
    },
});
