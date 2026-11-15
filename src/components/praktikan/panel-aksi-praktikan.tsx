import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { AppButton } from '@/components/ui/app-button';
import type { StatusIzin } from '@/types';
import type { StatusSesi } from '@/types';

type PanelAksiPraktikanProps = {
    statusSesi: StatusSesi;
    statusIzin?: StatusIzin | null;
    izinLoading?: boolean;
    sudahPresensi?: boolean;
    waktuPresensi?: string;
    onPressPresensi: () => void;
    onPressAjukanIzin: () => void;
};

export function PanelAksiPraktikan({
    statusSesi,
    statusIzin = null,
    izinLoading = false,
    sudahPresensi = false,
    waktuPresensi,
    onPressPresensi,
    onPressAjukanIzin,
}: PanelAksiPraktikanProps) {
    const sesiDibuka = statusSesi === 'DIBUKA';

    const izinAktif =
        statusIzin === 'MENUNGGU' ||
        statusIzin === 'DISETUJUI';

    const presensiNonaktif =
        !sesiDibuka ||
        sudahPresensi ||
        izinAktif ||
        izinLoading;

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

    let judulTombol = 'Scan QR';
    let pesanPresensi = '';

    if (sudahPresensi) {
        judulTombol = 'Sudah Presensi';
        pesanPresensi = waktuPresensi
            ? `Presensi tercatat pada ${waktuPresensi}.`
            : 'Kehadiranmu sudah tercatat.';
    } else if (izinAktif) {
        judulTombol = 'Presensi Tidak Tersedia';
        pesanPresensi =
            statusIzin === 'MENUNGGU'
                ? 'Pengajuan izin sedang menunggu pemeriksaan asisten.'
                : 'Pengajuan izin telah disetujui. Kamu tidak perlu melakukan presensi.';
    } else if (izinLoading) {
        pesanPresensi = 'Memeriksa status pengajuan izin...';
    } else if (statusSesi === 'BELUM_DIBUKA') {
        pesanPresensi = 'Tombol presensi aktif setelah sesi dibuka.';
    } else if (statusSesi === 'DITUTUP') {
        pesanPresensi = 'Kamu tidak dapat melakukan presensi pada sesi ini.';
    } else if (statusIzin === 'DITOLAK') {
        pesanPresensi = 'Pengajuan izin ditolak. Kamu masih dapat melakukan presensi selama sesi dibuka.';
    }

    const bolehAjukanIzin =
      statusSesi !== 'DITUTUP' &&
      !sudahPresensi &&
      !statusIzin;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Presensi Praktikum</Text>
                <Text style={styles.subtitle}>
                    Pastikan status sesi sebelum melakukan presensi.
                </Text>
            </View>

            <View style={[
                styles.statusCard,
                { backgroundColor: statusInfo.backgroundColor },
            ]}>
                <View style={[
                    styles.statusIndicator,
                    { backgroundColor: statusInfo.color },
                ]} />

                <View style={styles.statusContent}>
                    <Text style={[
                        styles.statusTitle,
                        { color: statusInfo.color },
                    ]}>
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
                <Text style={styles.helperText}>
                    {pesanPresensi}
                </Text>
            )}

            {bolehAjukanIzin && (
                <AppButton
                    title="Ajukan Izin"
                    onPress={onPressAjukanIzin}
                    variant="outline"
                    size="large"
                    fullWidth
                />
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
    title: {
        color: Colors.light.text,
        fontSize: 19,
        fontWeight: '700',
    },
    subtitle: {
        color: Colors.light.textSecondary,
        fontSize: 13,
        lineHeight: 20,
    },
    statusCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 14,
        borderRadius: 14,
        gap: 10,
    },
    statusIndicator: {
        width: 9,
        height: 9,
        borderRadius: 5,
        marginTop: 5,
    },
    statusContent: { flex: 1, gap: 4 },
    statusTitle: { fontSize: 14, fontWeight: '700' },
    statusDescription: {
        color: Colors.light.text,
        fontSize: 13,
        lineHeight: 19,
    },
    helperText: {
        color: Colors.light.textSecondary,
        fontSize: 12,
        lineHeight: 18,
        textAlign: 'center',
    },
});
