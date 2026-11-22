
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Constants from 'expo-constants';

import { useLaboratorium } from '@/hooks/use-laboratorium';
import { useUserLocation } from '@/hooks/use-user-location';
import type { Laboratorium } from '@/types';

import LaboratoryMap from '@/components/maps/laboratory-map';
import LaboratoryInfoSheet from '@/components/maps/laboratory-info-sheet';

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

export default function MapsScreen({ role }: Props) {
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
    ? 'Izin lokasi ditolak. Marker laboratorium tetap ditampilkan.'
    : servicesDisabled
      ? 'GPS tidak aktif. Aktifkan GPS untuk menampilkan lokasi Anda.'
      : lokasiError
        ? lokasiError
        : !position && lokasiLoading
          ? 'Sedang mendapatkan lokasi perangkat...'
          : !position
            ? 'Lokasi perangkat belum tersedia.'
            : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.heading}>
          <Text style={styles.title}>Peta Laboratorium</Text>
          <Text style={styles.subtitle}>
            Lokasi laboratorium untuk {role.toLowerCase()}
          </Text>
        </View>

        <Pressable
          style={styles.refreshButton}
          onPress={() => void perbarui()}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.refreshText}>↻ Muat Ulang</Text>
          )}
        </Pressable>
      </View>

      {statusLokasi && (
        <View style={styles.locationNotice}>
          <Text style={styles.warning}>{statusLokasi}</Text>

          {!permissionDenied && (
            <Pressable onPress={() => void pusatkanLokasi()}>
              <Text style={styles.retry}>Perbarui lokasi</Text>
            </Pressable>
          )}
        </View>
      )}

      {!!error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void muatData()}>
            <Text style={styles.retry}>Coba lagi</Text>
          </Pressable>
        </View>
      )}

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="small" />
          <Text style={styles.subtitle}>Memuat data laboratorium...</Text>
        </View>
      )}

      {!mapsConfigured ? (
        <View style={styles.mapError}>
          <Text style={styles.errorText}>
            Google Maps API key belum dikonfigurasi. Peta belum dapat
            ditampilkan.
          </Text>
        </View>
      ) : labDalamRadius ? (
        <View style={styles.radiusNotice}>
          <Text style={styles.radiusTitle}>
            Anda berada dalam radius laboratorium
          </Text>

          <Text style={styles.subtitle}>
            Laboratorium: {labDalamRadius.lab.nama}
          </Text>

          <Text style={styles.subtitle}>
            Jarak: {Math.round(labDalamRadius.jarak)} meter.
          </Text>

          <Text style={styles.subtitle}>
            Radius presensi: {labDalamRadius.lab.radiusPresensi} meter.
          </Text>

          <Text style={styles.subtitle}>
            Peta ditampilkan ketika Anda berada di luar radius seluruh
            laboratorium aktif.
          </Text>
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
            style={styles.myLocationButton}
            onPress={() => void pusatkanLokasi()}
          >
            <Text style={styles.myLocationText}>◎</Text>
          </Pressable>
        </View>
      )}

      {!loading && !error && labAktif.length === 0 && (
        <Text style={styles.warning}>
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
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  heading: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#172033',
  },
  subtitle: {
    fontSize: 13,
    color: '#667085',
    marginTop: 4,
  },
  refreshButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  refreshText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  locationNotice: {
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  warning: {
    color: '#9A6700',
    fontSize: 12,
  },
  retry: {
    color: '#175CD3',
    fontWeight: '600',
    marginTop: 6,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  errorText: {
    color: '#B42318',
    fontSize: 13,
    textAlign: 'center',
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  mapContainer: {
    flex: 1,
    minHeight: 250,
    position: 'relative',
  },
  mapError: {
    flex: 1,
    minHeight: 250,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F2F4F7',
    borderRadius: 12,
  },
  myLocationButton: {
    position: 'absolute',
    right: 14,
    bottom: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  myLocationText: {
    color: '#2563EB',
    fontSize: 27,
    fontWeight: '700',
  },
  radiusNotice: {
    minHeight: 250,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
  },
  radiusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#172033',
    textAlign: 'center',
    marginBottom: 8,
  },
});
