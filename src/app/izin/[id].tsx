import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { KategoriAiBadge } from '@/components/praktikan/kategori-ai-badge';
import { STATUS_IZIN, type StatusIzin } from '@/constants/status-izin';
import { Colors, Spacing } from '@/constants/theme';

const dataContoh = {
  sesi: 'Praktikum Pemrograman Mobile',
  waktu: 'Senin, 19 Oktober 2026 • 09.00 WIB',
  alasan: 'Saya sedang sakit dan perlu beristirahat sehingga tidak dapat mengikuti praktikum.',
  status: 'MENUNGGU' as StatusIzin,
  kategoriAi: 'Kesehatan',
  catatanAsisten: '',
};

export default function DetailIzinScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const status = STATUS_IZIN[dataContoh.status];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Detail Pengajuan Izin</Text>
        <Text style={styles.subtitle}>ID Pengajuan: {id}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Status Pengajuan</Text>
        <View style={[styles.statusBadge, { backgroundColor: status.background }]}>
          <Text style={[styles.statusText, { color: status.color }]}>
            {status.label}
          </Text>
        </View>
        <Text style={styles.statusDescription}>
          {dataContoh.status === 'MENUNGGU'
            ? 'Pengajuan kamu sedang menunggu pemeriksaan asisten.'
            : dataContoh.status === 'DISETUJUI'
              ? 'Pengajuan izin kamu telah disetujui.'
              : 'Pengajuan izin kamu telah ditolak.'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Informasi Praktikum</Text>
        <Text style={styles.label}>Nama Sesi</Text>
        <Text style={styles.value}>{dataContoh.sesi}</Text>

        <Text style={styles.label}>Waktu Praktikum</Text>
        <Text style={styles.value}>{dataContoh.waktu}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Alasan Izin</Text>
        <Text style={styles.value}>{dataContoh.alasan}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Hasil Klasifikasi AI</Text>
        <KategoriAiBadge kategori={dataContoh.kategoriAi} />
        <Text style={styles.note}>
          Klasifikasi AI hanya informasi pendukung dan bukan keputusan akhir pengajuan.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Catatan Asisten</Text>
        <Text style={styles.value}>
          {dataContoh.catatanAsisten || 'Belum ada catatan dari asisten.'}
        </Text>
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
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  header: {
    gap: 6,
  },
  title: {
    color: Colors.light.text,
    fontSize: 23,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
  card: {
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    gap: Spacing.two,
  },
  sectionTitle: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusDescription: {
    color: Colors.light.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  label: {
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
  value: {
    color: Colors.light.text,
    fontSize: 13,
    lineHeight: 20,
  },
  note: {
    color: Colors.light.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});