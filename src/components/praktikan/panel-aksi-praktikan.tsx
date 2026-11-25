import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import {
  IconCheckCircle,
  IconClock,
  IconQrCode,
  IconXCircle,
} from '@/components/ui/icons';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';
import type { StatusIzin, StatusSesi } from '@/types';

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
    statusIzin === 'MENUNGGU' || statusIzin === 'DISETUJUI';

  const presensiNonaktif =
    !sesiDibuka || sudahPresensi || izinAktif || izinLoading;

  const statusInfo = {
    BELUM_DIBUKA: {
      label: 'Sesi belum dibuka',
      description: 'Tunggu asisten membuka sesi praktikum.',
      color: Colors.light.warning,
      backgroundColor: Colors.light.warningSoft,
      icon: <IconClock size={18} color={Colors.light.warning} />,
    },
    DIBUKA: {
      label: 'Sesi berlangsung',
      description: 'Siap melakukan presensi dengan scan QR.',
      color: Colors.light.success,
      backgroundColor: Colors.light.successSoft,
      icon: <IconCheckCircle size={18} color={Colors.light.success} />,
    },
    DITUTUP: {
      label: 'Sesi ditutup',
      description: 'Presensi tidak tersedia lagi.',
      color: Colors.light.danger,
      backgroundColor: Colors.light.dangerSoft,
      icon: <IconXCircle size={18} color={Colors.light.danger} />,
    },
  }[statusSesi];

  let judulTombol = 'Scan QR';
  let pesanPresensi = '';

  if (sudahPresensi) {
    judulTombol = 'Sudah Presensi';
    pesanPresensi = waktuPresensi
      ? `Tercatat pada ${waktuPresensi}`
      : 'Kehadiranmu sudah tercatat.';
  } else if (izinAktif) {
    judulTombol = 'Presensi Tidak Tersedia';
    pesanPresensi =
      statusIzin === 'MENUNGGU'
        ? 'Pengajuan izin sedang menunggu pemeriksaan.'
        : 'Pengajuan izin telah disetujui.';
  } else if (izinLoading) {
    pesanPresensi = 'Memeriksa status izin...';
  } else if (statusSesi === 'BELUM_DIBUKA') {
    pesanPresensi = 'Scan QR aktif setelah sesi dibuka.';
  } else if (statusSesi === 'DITUTUP') {
    pesanPresensi = 'Sesi telah berakhir.';
  } else if (statusIzin === 'DITOLAK') {
    pesanPresensi = 'Izin ditolak · silakan lakukan scan QR.';
  }

  const bolehAjukanIzin =
    statusSesi !== 'DITUTUP' &&
    !sudahPresensi &&
    !statusIzin &&
    !izinLoading;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.statusCard,
          { backgroundColor: statusInfo.backgroundColor },
        ]}
      >
        <View style={styles.statusIconCircle}>{statusInfo.icon}</View>
        <View style={styles.statusContent}>
          <Text style={[styles.statusTitle, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
          <Text style={styles.statusDescription}>{statusInfo.description}</Text>
        </View>
      </View>

      <AppButton
        title={judulTombol}
        onPress={onPressPresensi}
        variant="primary"
        size="large"
        fullWidth
        disabled={presensiNonaktif}
        icon={
          !sudahPresensi && !izinAktif ? (
            <IconQrCode size={18} color="#FFFFFF" />
          ) : undefined
        }
      />

      {pesanPresensi !== '' && (
        <Text style={styles.helperText}>{pesanPresensi}</Text>
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
    borderRadius: Radii.xl,
    padding: 18,
    gap: 14,
    ...Shadows.card,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Radii.md,
    gap: 12,
  },
  statusIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.light.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusContent: {
    flex: 1,
    gap: 2,
  },
  statusTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 13.5,
  },
  statusDescription: {
    fontFamily: Fonts.sans,
    color: Colors.light.text,
    fontSize: 12.5,
    lineHeight: 17,
  },
  helperText: {
    fontFamily: Fonts.sansMedium,
    color: Colors.light.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
});
