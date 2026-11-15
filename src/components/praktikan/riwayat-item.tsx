import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import type { Sesi, Presensi } from '@/types';
import { formatWaktu } from '@/utils/format-waktu';

export type RiwayatItemProps = { sesi: Sesi; presensi: Presensi };


export function RiwayatItem({ sesi, presensi }: RiwayatItemProps) {
  const waktu = presensi.waktuHadir ? formatWaktu(presensi.waktuHadir.toISOString()) : 'Menunggu konfirmasi server';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.nama}>{sesi.judul}</Text>
          <Text style={styles.lokasi}>{sesi.lokasi}</Text>
          <Text style={styles.jadwal}>{formatWaktu(sesi.waktuMulai.toISOString())}</Text>
        </View>
        <View style={[styles.badge, styles.hadir]}>
          <Text style={[styles.status, styles.teksHadir]}>Hadir</Text>
        </View>
      </View>
      <Text style={styles.waktu}>Waktu presensi: {waktu}</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    gap: 12,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  info: { flex: 1, gap: 5 },
  nama: { fontSize: 15, fontWeight: '700', color: Colors.light.text },
  lokasi: { fontSize: 13, color: Colors.light.textSecondary },
  jadwal: { fontSize: 12, color: Colors.light.textSecondary },
  badge: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 8 },
  hadir: { backgroundColor: Colors.light.successSoft },
  status: { fontSize: 11, fontWeight: '700' },
  teksHadir: { color: Colors.light.success },
  waktu: { fontSize: 12, color: Colors.light.textSecondary },
});
