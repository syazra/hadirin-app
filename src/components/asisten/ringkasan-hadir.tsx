import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

export interface RingkasanHadirProps {
  jumlahHadir: number;
  label?: string;
  satuan?: string;
}

export function RingkasanHadir({
  jumlahHadir,
  label = 'Jumlah hadir',
  satuan = 'praktikan',
}: RingkasanHadirProps) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${jumlahHadir} ${satuan}`}
      accessibilityLiveRegion="polite"
      style={styles.container}
    >
      <Text style={styles.label}>{label}</Text>
      <View style={styles.total}>
        <Text style={styles.count}>{jumlahHadir}</Text>
        <Text style={styles.unit}>{satuan}</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    padding: Spacing.four,
    gap: Spacing.two,
    borderRadius: 16,
    backgroundColor: Colors.light.accentSoft,
  },
  label: { color: Colors.light.text, fontSize: 16, fontWeight: '600' },
  total: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: Spacing.two },
  count: { color: Colors.light.text, fontSize: 32, fontWeight: '700' },
  unit: { color: Colors.light.text, fontSize: 16 },
});
