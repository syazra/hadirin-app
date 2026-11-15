import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { RiwayatItem } from '@/components/praktikan/riwayat-item';
import { EmptyState } from '@/components/ui/empty-state';
import { LayarPersiapan } from '@/components/shared/layar-persiapan';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useRiwayatKehadiran } from '@/hooks/use-riwayat-kehadiran';


export default function RiwayatScreen() {
  const { pengguna } = useAuth();
  const { riwayat, loading, error } = useRiwayatKehadiran(pengguna?.uid ?? '');
  const jumlahHadir = riwayat.length;

  if (!pengguna || pengguna.peran !== 'PRAKTIKAN') {
    return (
      <LayarPersiapan
        judul="Riwayat kehadiran"
        pesan="Masuk sebagai praktikan untuk melihat riwayat presensi."
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Riwayat Kehadiran</Text>
        <Text style={styles.subtitle}>
          Halo, {pengguna.nama}. Berikut catatan kehadiranmu.
        </Text>
      </View>

      {riwayat.length > 0 && (
        <View style={styles.ringkasan}>
          <Text style={styles.keterangan}>Total hadir: {jumlahHadir} sesi</Text>
        </View>
      )}


      <Text style={styles.label}>Riwayat Presensi</Text>

      {loading ? (
        <Text>Memuat riwayat presensi...</Text>
      ) : riwayat.length > 0 ? (
        <>
          {error && (
            <Text style={styles.error}>
              {error}
            </Text>
          )}

          <View style={styles.daftar}>
            {riwayat.map((item) => (
              <RiwayatItem
                key={item.presensi.idPresensi}
                {...item}
              />
            ))}
          </View>
        </>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <EmptyState
          judul="Belum ada catatan kehadiran"
          pesan="Presensi yang kamu lakukan akan muncul di sini."
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.four, gap: Spacing.three, paddingBottom: 32 },
  header: { gap: Spacing.two },
  title: { fontSize: 24, fontWeight: '700', color: Colors.light.text },
  subtitle: { fontSize: 14, lineHeight: 21, color: Colors.light.textSecondary },
  ringkasan: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    gap: 5,
  },
  keterangan: { fontSize: 14, color: Colors.light.backgroundElement },
  label: { fontSize: 16, fontWeight: '700', color: Colors.light.text },
  daftar: { gap: 12 },
  error: { color: Colors.light.danger, fontSize: 12, lineHeight: 18 },
});
