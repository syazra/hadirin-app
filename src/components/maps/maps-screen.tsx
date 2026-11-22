import { useState } from 'react';
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

type Props = { role: 'Asisten' | 'Praktikan' };

export default function MapsScreen({ role }: Props) {
  const { daftarLaboratorium, loading, error, muatData } = useLaboratorium();
  const {
    position,
    loading: lokasiLoading,
    permissionDenied,
    servicesDisabled,
    error: lokasiError,
    refresh,
  } = useUserLocation({ watch: true });

  const [labTerpilih, setLabTerpilih] = useState<Laboratorium | null>(null);

  const mapsConfigured =
    Constants.expoConfig?.extra?.maps?.androidConfigured === true;

  const labAktif = daftarLaboratorium.filter((lab) => lab.aktif);

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
        <Text style={styles.title}>Peta Laboratorium</Text>
        <Text style={styles.subtitle}>
          Lokasi laboratorium untuk {role.toLowerCase()}
        </Text>
      </View>

      {statusLokasi && (
        <View style={styles.locationNotice}>
          <Text style={styles.warning}>{statusLokasi}</Text>
          {!permissionDenied && (
            <Pressable onPress={() => void refresh()}>
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

      {mapsConfigured ? (
        <View style={styles.mapContainer}>
          <LaboratoryMap
            laboratorium={labAktif}
            posisiPengguna={position}
            onSelectLab={setLabTerpilih}
            onClearSelection={() => setLabTerpilih(null)}
          />
        </View>
      ) : (
        <View style={styles.mapError}>
          <Text style={styles.errorText}>
            Google Maps API key belum dikonfigurasi. Peta belum dapat ditampilkan.
          </Text>
        </View>
      )}

      {!loading && !error && labAktif.length === 0 && (
        <Text style={styles.warning}>Belum ada laboratorium aktif.</Text>
      )}

      <LaboratoryInfoSheet
        laboratorium={labTerpilih}
        onClose={() => setLabTerpilih(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#FFFFFF' },
  header: { marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#172033' },
  subtitle: { fontSize: 13, color: '#667085', marginTop: 4 },
  locationNotice: {
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  warning: { color: '#9A6700', fontSize: 12 },
  retry: { color: '#175CD3', fontWeight: '600', marginTop: 6 },
  errorBox: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  errorText: { color: '#B42318', fontSize: 13, textAlign: 'center' },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  mapContainer: { flex: 1, minHeight: 250 },
  mapError: {
    flex: 1,
    minHeight: 250,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F2F4F7',
    borderRadius: 12,
  },
});