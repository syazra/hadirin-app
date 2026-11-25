import Constants from 'expo-constants';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import LaboratoryInfoSheet from '@/components/maps/laboratory-info-sheet';
import LaboratoryMap from '@/components/maps/laboratory-map';
import {
  IconAlertCircle,
  IconCheckCircle,
  IconCrosshair,
  IconMap,
  IconMapPin,
  IconRefresh,
} from '@/components/ui/icons';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';
import { useLaboratorium } from '@/hooks/use-laboratorium';
import { useUserLocation } from '@/hooks/use-user-location';
import type { Laboratorium } from '@/types';

type Props = {
  role: 'Asisten' | 'Praktikan';
};

function hitungJarakMeter(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const rad = (derajat: number) => (derajat * Math.PI) / 180;

  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) *
      Math.cos(rad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MapsScreen({ role: _role }: Props) {
  const {
    daftarLaboratorium,
    loading,
    error,
    muatData,
  } = useLaboratorium();

  const {
    position,
    loading: lokasiLoading,
    permissionDenied,
    servicesDisabled,
    error: lokasiError,
    refresh,
  } = useUserLocation({ watch: true });

  const [labTerpilih, setLabTerpilih] = useState<Laboratorium | null>(null);
  const [centerRequest, setCenterRequest] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const mapsConfigured =
    Constants.expoConfig?.extra?.maps?.androidConfigured === true;

  // Hanya laboratorium aktif yang digunakan untuk pengecekan radius.
  const labAktif = useMemo(
    () => daftarLaboratorium.filter((lab) => lab.aktif),
    [daftarLaboratorium],
  );

  // Cari laboratorium aktif yang radiusnya mencakup lokasi pengguna.
  const labDalamRadius = position
    ? labAktif.reduce<{ lab: Laboratorium; jarak: number } | null>(
        (hasil, lab) => {
          if (hasil) return hasil;

          const jarak = hitungJarakMeter(
            position.latitude,
            position.longitude,
            lab.latitude,
            lab.longitude,
          );

          return jarak <= lab.radiusPresensi ? { lab, jarak } : null;
        },
        null,
      )
    : null;

  const perbarui = async () => {
    if (refreshing) return;

    setRefreshing(true);

    try {
      await Promise.all([muatData(), refresh()]);
      setCenterRequest((value) => value + 1);
    } finally {
      setRefreshing(false);
    }
  };

  const pusatkanLokasi = async () => {
    await refresh();
    setCenterRequest((value) => value + 1);
  };

  const statusLokasi = permissionDenied
    ? 'Izin lokasi ditolak · marker lab tetap tampil.'
    : servicesDisabled
      ? 'GPS tidak aktif · aktifkan GPS untuk posisi Anda.'
      : lokasiError
        ? lokasiError
        : !position && lokasiLoading
          ? 'Mencari koordinat perangkat...'
          : !position
            ? 'Lokasi perangkat belum tersedia.'
            : null;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.summaryPill}>
          <IconMapPin size={15} color={Colors.light.teal} />
          <Text style={styles.summaryText}>
            {labAktif.length} Lab Aktif
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.refreshButton,
            pressed && styles.pressed,
          ]}
          onPress={() => void perbarui()}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <IconRefresh size={14} color="#FFFFFF" strokeWidth={2.2} />
              <Text style={styles.refreshText}>Muat ulang</Text>
            </>
          )}
        </Pressable>
      </View>

      {statusLokasi && (
        <View style={styles.locationNotice}>
          <IconAlertCircle size={16} color={Colors.light.warning} />
          <Text style={styles.warning}>{statusLokasi}</Text>

          {!permissionDenied && (
            <Pressable
              onPress={() => void pusatkanLokasi()}
              style={styles.retryPill}
            >
              <Text style={styles.retry}>Perbarui</Text>
            </Pressable>
          )}
        </View>
      )}

      {!!error && (
        <View style={styles.errorBox}>
          <IconAlertCircle size={16} color={Colors.light.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void muatData()} style={styles.retryPill}>
            <Text style={styles.retry}>Coba lagi</Text>
          </Pressable>
        </View>
      )}

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Memuat data laboratorium...</Text>
        </View>
      )}

      {!mapsConfigured ? (
        <View style={styles.mapError}>
          <View style={styles.medallionNeutral}>
            <IconMap size={24} color={Colors.light.teal} />
          </View>
          <Text style={styles.mapErrorTitle}>Peta belum dikonfigurasi</Text>
          <Text style={styles.mapErrorDesc}>
            Google Maps API key belum tersedia untuk perangkat ini.
          </Text>
        </View>
      ) : labDalamRadius ? (
        <View style={styles.radiusNotice}>
          <View style={styles.radiusMedallion}>
            <IconCheckCircle size={26} color={Colors.light.success} />
          </View>
          <Text style={styles.radiusTitle}>
            Di dalam radius {labDalamRadius.lab.nama}
          </Text>
          <Text style={styles.radiusSub}>
            Lokasi Anda berada di dalam area presensi
          </Text>

          <View style={styles.radiusPills}>
            <View style={styles.radiusMetricPill}>
              <Text style={styles.radiusMetricLabel}>Jarak</Text>
              <Text style={styles.radiusMetricValue}>
                {Math.round(labDalamRadius.jarak)} m
              </Text>
            </View>
            <View style={styles.radiusMetricPill}>
              <Text style={styles.radiusMetricLabel}>Radius</Text>
              <Text style={styles.radiusMetricValue}>
                {labDalamRadius.lab.radiusPresensi} m
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.mapContainer}>
          <LaboratoryMap
            laboratorium={labAktif}
            posisiPengguna={position}
            onSelectLab={setLabTerpilih}
            onClearSelection={() => setLabTerpilih(null)}
            centerRequest={centerRequest}
          />

          <Pressable
            style={({ pressed }) => [
              styles.myLocationButton,
              pressed && styles.pressed,
            ]}
            onPress={() => void pusatkanLokasi()}
            accessibilityRole="button"
            accessibilityLabel="Pusatkan lokasi saya"
          >
            <IconCrosshair size={21} color={Colors.light.primary} />
          </Pressable>
        </View>
      )}

      {!loading && !error && labAktif.length === 0 && (
        <Text style={styles.emptyLabWarning}>
          Belum ada laboratorium aktif.
        </Text>
      )}

      <LaboratoryInfoSheet
        laboratorium={labTerpilih}
        onClose={() => setLabTerpilih(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 14,
    gap: 12,
    backgroundColor: Colors.light.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radii.pill,
    paddingHorizontal: 13,
    paddingVertical: 8,
    ...Shadows.subtle,
  },
  summaryText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12.5,
    color: Colors.light.text,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: Radii.md,
    minWidth: 108,
    ...Shadows.primaryGlow,
  },
  refreshText: {
    fontFamily: Fonts.sansSemiBold,
    color: '#FFFFFF',
    fontSize: 12.5,
  },
  pressed: {
    opacity: 0.84,
  },
  locationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: Colors.light.warningSoft,
    borderWidth: 1,
    borderColor: '#F6DFB0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radii.md,
  },
  warning: {
    flex: 1,
    fontFamily: Fonts.sansMedium,
    color: Colors.light.warning,
    fontSize: 12,
    lineHeight: 17,
  },
  retryPill: {
    backgroundColor: Colors.light.card,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  retry: {
    fontFamily: Fonts.sansSemiBold,
    color: Colors.light.primary,
    fontSize: 11.5,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: Colors.light.dangerSoft,
    borderWidth: 1,
    borderColor: '#FAD0DC',
    padding: 12,
    borderRadius: Radii.md,
  },
  errorText: {
    flex: 1,
    fontFamily: Fonts.sansMedium,
    color: Colors.light.danger,
    fontSize: 12.5,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12.5,
    color: Colors.light.textSecondary,
  },
  mapContainer: {
    flex: 1,
    minHeight: 260,
    position: 'relative',
    borderRadius: Radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    ...Shadows.card,
  },
  mapError: {
    flex: 1,
    minHeight: 260,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 8,
    backgroundColor: Colors.light.card,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.card,
  },
  medallionNeutral: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  mapErrorTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    color: Colors.light.text,
    textAlign: 'center',
  },
  mapErrorDesc: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    maxWidth: 260,
  },
  myLocationButton: {
    position: 'absolute',
    right: 14,
    bottom: 16,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.elevated,
  },
  radiusNotice: {
    flex: 1,
    minHeight: 260,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 10,
    backgroundColor: Colors.light.card,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: '#CDEEE0',
    ...Shadows.card,
  },
  radiusMedallion: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.light.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  radiusTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 17,
    color: Colors.light.text,
    textAlign: 'center',
  },
  radiusSub: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  radiusPills: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  radiusMetricPill: {
    backgroundColor: Colors.light.successSoft,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radii.md,
    alignItems: 'center',
    gap: 2,
  },
  radiusMetricLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  radiusMetricValue: {
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    color: Colors.light.success,
  },
  emptyLabWarning: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12.5,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});
