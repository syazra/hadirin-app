import { StyleSheet, Text, View } from 'react-native';

import { STATUS_SESI } from '@/constants/status-sesi';
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
    warna: '#B45309',
    warnaLatar: '#FEF3C7',
    konteks: 'Status izin',
  },
  DISETUJUI: {
    label: 'Disetujui',
    warna: '#15803D',
    warnaLatar: '#DCFCE7',
    konteks: 'Status izin',
  },
  DITOLAK: {
    label: 'Ditolak',
    warna: '#B91C1C',
    warnaLatar: '#FEE2E2',
    konteks: 'Status izin',
  },
  HADIR: {
    label: 'Hadir',
    warna: '#15803D',
    warnaLatar: '#DCFCE7',
    konteks: 'Status rekap',
  },
  SAKIT: {
    label: 'Sakit',
    warna: '#7E22CE',
    warnaLatar: '#F3E8FF',
    konteks: 'Status rekap',
  },
  IZIN: {
    label: 'Izin',
    warna: '#1D4ED8',
    warnaLatar: '#DBEAFE',
    konteks: 'Status rekap',
  },
  ALPHA: {
    label: 'Alpha',
    warna: '#B91C1C',
    warnaLatar: '#FEE2E2',
    konteks: 'Status rekap',
  },
  BELUM_HADIR: {
    label: 'Belum Hadir',
    warna: '#475569',
    warnaLatar: '#F1F5F9',
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
        warna: '#475569',
        warnaLatar: '#F1F5F9',
        konteks: 'Status',
      });

  return (
    <View
      style={[styles.badge, { backgroundColor: config.warnaLatar }]}
      accessibilityRole="text"
      accessibilityLabel={`${config.konteks}: ${config.label}`}
    >
      <Text style={[styles.label, { color: config.warna }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});