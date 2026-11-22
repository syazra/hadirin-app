import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import type { KoordinatPengguna } from '@/types/location';

export function hitungJarakMeterLokal(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export interface TargetLabPresensi {
  namaLab: string;
  latitude: number;
  longitude: number;
  radiusPresensi: number;
}

export interface PresensiLocationStatusProps {
  loading: boolean;
  permissionDenied: boolean;
  servicesDisabled: boolean;
  position: KoordinatPengguna | null;
  isLowAccuracy: boolean;
  error: string | null;
  targetLab: TargetLabPresensi | null;
  onRefresh: () => void;
}

function formatJamSingkat(timestamp: number): string {
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return '';
  const jam = String(d.getHours()).padStart(2, '0');
  const menit = String(d.getMinutes()).padStart(2, '0');
  const detik = String(d.getSeconds()).padStart(2, '0');
  return `${jam}:${menit}:${detik}`;
}

export function PresensiLocationStatus({
  loading,
  permissionDenied,
  servicesDisabled,
  position,
  isLowAccuracy,
  error,
  targetLab,
  onRefresh,
}: PresensiLocationStatusProps) {
  if (loading && !position) {
    return (
      <View style={[styles.card, styles.cardInfo]}>
        <ActivityIndicator size="small" color={Colors.light.primary} />
        <View style={styles.textWrap}>
          <Text style={styles.titleInfo}>Mendeteksi lokasi GPS...</Text>
          <Text style={styles.subtitle}>
            Pastikan berada di area laboratorium agar sinyal akurat.
          </Text>
        </View>
      </View>
    );
  }

  if (servicesDisabled || permissionDenied || error || !position) {
    return (
      <View style={[styles.card, styles.cardError]}>
        <View style={styles.textWrap}>
          <Text style={styles.titleError}>
            {servicesDisabled
              ? 'GPS perangkat tidak aktif'
              : permissionDenied
                ? 'Izin lokasi ditolak'
                : 'Lokasi tidak tersedia'}
          </Text>
          <Text style={styles.subtitle}>
            {error ?? 'Aktifkan GPS dan izinkan akses lokasi untuk presensi.'}
          </Text>
        </View>
        <Pressable
          onPress={onRefresh}
          disabled={loading}
          hitSlop={10}
          style={({ pressed }) => [
            styles.retryBtn,
            (pressed || loading) && styles.retryBtnDisabled,
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.light.primary} />
          ) : (
            <Text style={styles.retryText}>Coba Lagi</Text>
          )}
        </Pressable>
      </View>
    );
  }

  const jarakMeter = targetLab
    ? Math.round(
        hitungJarakMeterLokal(
          position.latitude,
          position.longitude,
          targetLab.latitude,
          targetLab.longitude,
        ),
      )
    : null;

  const diLuarRadius =
    targetLab !== null &&
    jarakMeter !== null &&
    jarakMeter > targetLab.radiusPresensi;

  const waktuUpdate = formatJamSingkat(position.timestamp);

  if (isLowAccuracy || diLuarRadius) {
    return (
      <View style={[styles.card, styles.cardWarning]}>
        <View style={styles.textWrap}>
          <Text style={styles.titleWarning}>
            {diLuarRadius
              ? `Di luar radius lab (${jarakMeter} m / maks ${targetLab?.radiusPresensi} m)`
              : `Akurasi GPS rendah (±${Math.round(position.accuracy ?? 0)} m)`}
          </Text>
          <Text style={styles.subtitle}>
            {diLuarRadius
              ? `Mendekatlah ke ${targetLab?.namaLab || 'area laboratorium'} sebelum memindai QR.`
              : 'Sinyal GPS belum stabil (butuh akurasi ≤ 50 m). Perbarui lokasi.'}
            {waktuUpdate ? ` • Diperbarui ${waktuUpdate}` : ''}
          </Text>
        </View>
        <Pressable
          onPress={onRefresh}
          disabled={loading}
          hitSlop={10}
          style={({ pressed }) => [
            styles.retryBtn,
            (pressed || loading) && styles.retryBtnDisabled,
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.light.primary} />
          ) : (
            <Text style={styles.retryText}>Perbarui</Text>
          )}
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.card, styles.cardSuccess]}>
      <View style={styles.textWrap}>
        <Text style={styles.titleSuccess}>
          Lokasi terverifikasi
          {jarakMeter !== null ? ` • ${jarakMeter} m dari lab` : ''}
        </Text>
        <Text style={styles.subtitle}>
          Akurasi GPS ±{Math.round(position.accuracy ?? 0)} m • Siap memindai QR
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
    gap: Spacing.two,
  },
  cardInfo: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  cardSuccess: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  cardWarning: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  cardError: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  textWrap: { flex: 1, gap: 2 },
  titleInfo: { fontSize: 13, fontWeight: '700', color: '#1E40AF' },
  titleSuccess: { fontSize: 13, fontWeight: '700', color: '#065F46' },
  titleWarning: { fontSize: 13, fontWeight: '700', color: '#92400E' },
  titleError: { fontSize: 13, fontWeight: '700', color: '#991B1B' },
  subtitle: { fontSize: 12, lineHeight: 17, color: '#374151' },
  retryBtn: {
    minWidth: 74,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  retryBtnDisabled: {
    opacity: 0.65,
  },
  retryText: { fontSize: 12, fontWeight: '600', color: '#111827' },
});