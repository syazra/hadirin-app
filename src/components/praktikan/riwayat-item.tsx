import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import type { ItemRiwayatKehadiran } from '@/types';

export type RiwayatItemProps = ItemRiwayatKehadiran;

export function RiwayatItem({ sesi, presensi }: RiwayatItemProps) {
  const sudahHadir = presensi !== null;
  const waktu = presensi ? new Date(presensi.waktuHadir).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.nama}>{sesi.namaPraktikum}</Text>
          <Text style={styles.lokasi}>{sesi.kelasLab}</Text>
          <Text style={styles.jadwal}>{sesi.waktu}</Text>
        </View>

        <View style={[styles.badge, sudahHadir ? styles.hadir : styles.belum]}>
          <Text style={[styles.status, sudahHadir ? styles.teksHadir : styles.teksBelum]}>
            {sudahHadir ? 'Hadir' : 'Belum presensi'}
          </Text>
        </View>
      </View>

      {waktu && <Text style={styles.waktu}>Waktu presensi: {waktu}</Text>}
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
  belum: { backgroundColor: Colors.light.warningSoft },
  status: { fontSize: 11, fontWeight: '700' },
  teksHadir: { color: Colors.light.success },
  teksBelum: { color: Colors.light.warning },
  waktu: { fontSize: 12, color: Colors.light.textSecondary },
});
