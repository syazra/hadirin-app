import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { IzinItem } from '@/components/praktikan/izin-item';
import { Colors, Spacing } from '@/constants/theme';
import type { StatusIzin } from '@/constants/status-izin';

const dataIzin: {
  id: string;
  namaSesi: string;
  waktuSesi: string;
  status: StatusIzin;
}[] = [
  {
    id: 'izin-001',
    namaSesi: 'Praktikum Pemrograman Mobile',
    waktuSesi: 'Senin, 19 Oktober 2026 • 09.00 WIB',
    status: 'MENUNGGU',
  },
  {
    id: 'izin-002',
    namaSesi: 'Praktikum Basis Data',
    waktuSesi: 'Rabu, 21 Oktober 2026 • 13.00 WIB',
    status: 'DISETUJUI',
  },
  {
    id: 'izin-003',
    namaSesi: 'Praktikum Kecerdasan Buatan',
    waktuSesi: 'Jumat, 23 Oktober 2026 • 10.00 WIB',
    status: 'DITOLAK',
  },
];

export default function IzinPraktikanScreen() {
  const router = useRouter();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heading}>
        <Text style={styles.title}>Pengajuan Izin</Text>
        <Text style={styles.subtitle}>Pantau pengajuan izin dan keputusan dari asisten praktikum.</Text>
      </View>

      <AppButton
        title="+ Ajukan Izin"
        onPress={() => router.push('/izin/ajukan')}
        fullWidth
      />

      <View style={styles.section}>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Riwayat Pengajuan</Text>
          <Text style={styles.count}>{dataIzin.length} pengajuan</Text>
        </View>

        {dataIzin.length > 0 ? (
          dataIzin.map((item) => (
            <IzinItem
              key={item.id}
              namaSesi={item.namaSesi}
              waktuSesi={item.waktuSesi}
              status={item.status}
              onPress={() => router.push(`/izin/${item.id}`)}
            />
          ))
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Belum ada pengajuan izin</Text>
            <Text style={styles.emptyDescription}>Pengajuan izin yang kamu buat akan muncul di halaman ini.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    padding: Spacing.three,
    gap: Spacing.four,
  },
  heading: {
    gap: Spacing.two,
  },
  title: {
    color: Colors.light.text,
    fontSize: 23,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.light.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  section: {
    gap: Spacing.three,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '700',
  },
  count: {
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
  empty: {
    padding: Spacing.four,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: Colors.light.card,
    gap: Spacing.two,
  },
  emptyTitle: {
    color: Colors.light.text,
    fontWeight: '700',
  },
  emptyDescription: {
    color: Colors.light.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
});