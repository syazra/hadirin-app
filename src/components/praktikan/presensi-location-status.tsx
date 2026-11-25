import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  IconAlertCircle,
  IconCheckCircle,
  IconCrosshair,
} from '@/components/ui/icons';
import { Colors, Fonts, Radii, Shadows, Spacing } from '@/constants/theme';
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
  isStale?: boolean;
  error: string | null;
  targetLab: TargetLabPresensi | null;
  onRefresh: () => void;
  onOpenSettings?: () => void;
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
  isStale = false,
  error,
  targetLab,
  onRefresh,
  onOpenSettings,
}: PresensiLocationStatusProps) {
  if (loading && !position) {
    return (
      <View style={[styles.card, styles.cardInfo]}>
        <View style={styles.iconCircle}>
          <ActivityIndicator size="small" color={Colors.light.primary} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.titleInfo}>Mendeteksi lokasi GPS...</Text>
          <Text style={styles.subtitle}>
            Pastikan berada di area laboratorium.
          </Text>
        </View>
      </View>
    );
  }

  if (servicesDisabled || permissionDenied || error || !position) {
    const tampilkanTombolPengaturan = Boolean(
      permissionDenied && onOpenSettings,
    );
    const aksiTombol = tampilkanTombolPengaturan ? onOpenSettings! : onRefresh;
    const tombolNonaktif = tampilkanTombolPengaturan ? false : loading;

    return (
      <View style={[styles.card, styles.cardError]}>
        <View style={styles.iconCircle}>
          <IconAlertCircle size={18} color={Colors.light.danger} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.titleError}>
            {servicesDisabled
              ? 'GPS perangkat tidak aktif'
              : permissionDenied
                ? 'Izin lokasi ditolak'
                : 'Lokasi tidak tersedia'}
          </Text>
          <Text style={styles.subtitle}>
            {error ??
              (permissionDenied
                ? 'Izin akses lokasi ditolak. Buka Pengaturan untuk mengizinkan akses lokasi.'
                : 'Aktifkan GPS dan izinkan akses lokasi.')}
          </Text>
        </View>
        <Pressable
          onPress={aksiTombol}
          disabled={tombolNonaktif}
          hitSlop={10}
          style={({ pressed }) => [
            styles.retryBtn,
            (pressed || tombolNonaktif) && styles.retryBtnDisabled,
          ]}
        >
          {!tampilkanTombolPengaturan && loading ? (
            <ActivityIndicator size="small" color={Colors.light.primary} />
          ) : (
            <Text style={styles.retryText}>
              {tampilkanTombolPengaturan ? 'Pengaturan' : 'Coba Lagi'}
            </Text>
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

  if (isLowAccuracy || isStale || diLuarRadius) {
    const judulPeringatan = diLuarRadius
      ? `Di luar radius (${jarakMeter}m / ${targetLab?.radiusPresensi}m)`
      : isLowAccuracy
        ? `Akurasi GPS rendah (±${Math.round(position.accuracy ?? 0)}m)`
        : 'Lokasi GPS kedaluwarsa';

    const pesanPeringatan = diLuarRadius
      ? `Mendekatlah ke ${targetLab?.namaLab || 'area lab'}.`
      : isLowAccuracy
        ? 'Butuh akurasi ≤ 50 m · perbarui lokasi.'
        : 'Titik lokasi sudah > 30 detik · perbarui sebelum scan QR.';

    return (
      <View style={[styles.card, styles.cardWarning]}>
        <View style={styles.iconCircle}>
          <IconCrosshair size={18} color={Colors.light.warning} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.titleWarning}>{judulPeringatan}</Text>
          <Text style={styles.subtitle}>
            {pesanPeringatan}
            {waktuUpdate ? ` · ${waktuUpdate}` : ''}
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
      <View style={styles.iconCircle}>
        <IconCheckCircle size={18} color={Colors.light.success} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.titleSuccess}>
          Lokasi terverifikasi
          {jarakMeter !== null ? ` · ${jarakMeter} m` : ''}
        </Text>
        <Text style={styles.subtitle}>
          Akurasi ±{Math.round(position.accuracy ?? 0)} m · siap scan QR
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
    padding: 12,
    borderRadius: Radii.md + 2,
    borderWidth: 1,
    gap: Spacing.two + 2,
    ...Shadows.subtle,
  },
  cardInfo: {
    backgroundColor: Colors.light.primarySoft,
    borderColor: '#D6DFFF',
  },
  cardSuccess: {
    backgroundColor: Colors.light.successSoft,
    borderColor: '#CDEEE0',
  },
  cardWarning: {
    backgroundColor: Colors.light.warningSoft,
    borderColor: '#F6DFB0',
  },
  cardError: {
    backgroundColor: Colors.light.dangerSoft,
    borderColor: '#FAD0DC',
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: Colors.light.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  titleInfo: {
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    color: Colors.light.primary,
  },
  titleSuccess: {
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    color: Colors.light.success,
  },
  titleWarning: {
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    color: Colors.light.warning,
  },
  titleError: {
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    color: Colors.light.danger,
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.light.textSecondary,
  },
  retryBtn: {
    minWidth: 72,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: Radii.sm,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  retryBtnDisabled: {
    opacity: 0.65,
  },
  retryText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.light.text,
  },
});
