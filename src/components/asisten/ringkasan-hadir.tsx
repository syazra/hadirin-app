import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

export interface RingkasanHadirProps {
  jumlahHadir: number;
}

export function RingkasanHadir({ jumlahHadir }: RingkasanHadirProps) {
  return (
    <View
      accessible
      accessibilityLabel={`${jumlahHadir} praktikan hadir`}
      accessibilityLiveRegion="polite"
      style={styles.container}
    >
      <Text style={styles.label}>Jumlah hadir</Text>
      <View style={styles.total}>
        <Text style={styles.count}>{jumlahHadir}</Text>
        <Text style={styles.unit}>praktikan</Text>
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
