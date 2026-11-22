import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

export interface RingkasanHadirProps {
  jumlahHadir: number;
  jumlahSakit?: number;
  jumlahIzin?: number;
  jumlahAlpha?: number;
  jumlahBelumHadir?: number;
  jumlahIzinMenunggu?: number;
  label?: string;
  satuan?: string;
}

export function RingkasanHadir({
  jumlahHadir,
  jumlahSakit = 0,
  jumlahIzin = 0,
  jumlahAlpha = 0,
  jumlahBelumHadir = 0,
  jumlahIzinMenunggu = 0,
  label = 'Ringkasan Kehadiran',
  satuan = 'praktikan',
}: RingkasanHadirProps) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${jumlahHadir} hadir, ${jumlahSakit} sakit, ${jumlahIzin} izin, ${jumlahAlpha} alpha, ${jumlahBelumHadir} belum hadir ${satuan}`}
      accessibilityLiveRegion="polite"
      style={styles.container}
    >
      <Text style={styles.label}>{label}</Text>

      <View style={styles.grid}>
        <View style={styles.statBox}>
          <Text style={styles.countHadir}>{jumlahHadir}</Text>
          <Text style={styles.statLabel}>Hadir</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.countSakit}>{jumlahSakit}</Text>
          <Text style={styles.statLabel}>Sakit</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.countIzin}>{jumlahIzin}</Text>
          <Text style={styles.statLabel}>Izin</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.countAlpha}>{jumlahAlpha}</Text>
          <Text style={styles.statLabel}>Alpha</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.countBelum}>{jumlahBelumHadir}</Text>
          <Text style={styles.statLabel}>Belum Hadir</Text>
        </View>
      </View>

      {jumlahIzinMenunggu > 0 && (
        <Text style={styles.catatan}>
          {jumlahIzinMenunggu} pengajuan izin masih menunggu pemeriksaan.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.four,
    gap: Spacing.three,
    borderRadius: 16,
    backgroundColor: Colors.light.accentSoft,
  },
  label: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  statBox: {
    minWidth: '30%',
    flexGrow: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 4,
  },
  countHadir: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.success,
  },
  countSakit: {
    fontSize: 22,
    fontWeight: '700',
    color: '#7E22CE',
  },
  countIzin: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  countAlpha: {
    fontSize: 22,
    fontWeight: '700',
    color: '#B91C1C',
  },
  countBelum: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  catatan: {
    fontSize: 12,
    fontWeight: '500',
    color: '#B45309',
  },
});