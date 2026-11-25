import { StyleSheet, Text, View } from 'react-native';

import { LivePulseDot } from '@/components/ui/motion';
import { STATUS_SESI } from '@/constants/status-sesi';
import { Colors, Fonts, Radii } from '@/constants/theme';
import type { StatusIzin, StatusRekap, StatusSesi } from '@/types';

export type StatusSesiBadge = StatusSesi;
export type StatusBadgeNilai = StatusSesi | StatusIzin | StatusRekap;

type StatusBadgeProps = {
  status: StatusBadgeNilai;
};

type KonfigurasiBadge = {
  label: string;
  warna: string;
  warnaLatar: string;
  konteks: string;
};

const KONFIGURASI_TAMBAHAN: Record<StatusIzin | StatusRekap, KonfigurasiBadge> = {
  MENUNGGU: {
    label: 'Menunggu',
    warna: Colors.light.warning,
    warnaLatar: Colors.light.warningSoft,
    konteks: 'Status izin',
  },
  DISETUJUI: {
    label: 'Disetujui',
    warna: Colors.light.success,
    warnaLatar: Colors.light.successSoft,
    konteks: 'Status izin',
  },
  DITOLAK: {
    label: 'Ditolak',
    warna: Colors.light.danger,
    warnaLatar: Colors.light.dangerSoft,
    konteks: 'Status izin',
  },
  HADIR: {
    label: 'Hadir',
    warna: Colors.light.success,
    warnaLatar: Colors.light.successSoft,
    konteks: 'Status rekap',
  },
  SAKIT: {
    label: 'Sakit',
    warna: Colors.light.brandMid,
    warnaLatar: Colors.light.brandMidSoft,
    konteks: 'Status rekap',
  },
  IZIN: {
    label: 'Izin',
    warna: Colors.light.primary,
    warnaLatar: Colors.light.primarySoft,
    konteks: 'Status rekap',
  },
  ALPHA: {
    label: 'Alpha',
    warna: Colors.light.danger,
    warnaLatar: Colors.light.dangerSoft,
    konteks: 'Status rekap',
  },
  BELUM_HADIR: {
    label: 'Belum Hadir',
    warna: Colors.light.textSecondary,
    warnaLatar: Colors.light.backgroundElement,
    konteks: 'Status rekap',
  },
};

function isStatusSesi(status: StatusBadgeNilai): status is StatusSesi {
  return status === 'BELUM_DIBUKA' || status === 'DIBUKA' || status === 'DITUTUP';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config: KonfigurasiBadge = isStatusSesi(status)
    ? { ...STATUS_SESI[status], konteks: 'Status sesi' }
    : (KONFIGURASI_TAMBAHAN[status] ?? {
        label: String(status),
        warna: Colors.light.textSecondary,
        warnaLatar: Colors.light.backgroundElement,
        konteks: 'Status',
      });

  return (
    <View
      style={[styles.badge, { backgroundColor: config.warnaLatar }]}
      accessibilityRole="text"
      accessibilityLabel={`${config.konteks}: ${config.label}`}
    >
      {status === 'DIBUKA' ? (
        <LivePulseDot color={config.warna} size={6} />
      ) : (
        <View style={[styles.dot, { backgroundColor: config.warna }]} />
      )}
      <Text style={[styles.label, { color: config.warna }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11.5,
    lineHeight: 15,
    includeFontPadding: false,
  },
});
