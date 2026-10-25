import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { RiwayatItem } from '@/components/praktikan/riwayat-item';
import { EmptyState } from '@/components/ui/empty-state';
import { LayarPersiapan } from '@/components/shared/layar-persiapan';
import { Colors, Spacing } from '@/constants/theme';
import { useApp } from '@/hooks/use-app';
import { useRiwayatKehadiran } from '@/hooks/use-riwayat-kehadiran';


export default function RiwayatScreen() {
  const { penggunaAktif } = useApp();
  const riwayat = useRiwayatKehadiran(penggunaAktif?.idPengguna ?? '');
  const jumlahHadir = riwayat.filter((item) => item.presensi !== null).length;

  if (!penggunaAktif || penggunaAktif.peran !== 'PRAKTIKAN') {
    return (
      <LayarPersiapan
        judul="Riwayat kehadiran"
        pesan="Pilih identitas praktikan untuk melihat riwayat presensi."
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Riwayat Kehadiran</Text>
        <Text style={styles.subtitle}>
          Halo, {penggunaAktif.nama}. Berikut catatan kehadiranmu.
        </Text>
      </View>

      <View style={styles.ringkasan}>
        <Text style={styles.jumlah}>{jumlahHadir}</Text>
        <Text style={styles.keterangan}>Total hadir: {jumlahHadir} sesi</Text>
      </View>

      
      <Text style={styles.label}>Riwayat Presensi</Text>

      {riwayat.length > 0 ? (
        <View style={styles.daftar}>
          {riwayat.map((item) => (
            <RiwayatItem key={item.sesi.idSesi} {...item} />
          ))}
        </View>
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
  jumlah: { fontSize: 36, fontWeight: '700', color: '#FFFFFF' },
  keterangan: { fontSize: 14, color: '#FFFFFF' },
  label: { fontSize: 16, fontWeight: '700', color: Colors.light.text },
  daftar: { gap: 12 },
  kosong: {
    padding: 24,
    borderRadius: 14,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    gap: 8,
  },
  kosongJudul: { fontSize: 16, fontWeight: '700', color: Colors.light.text },
});
