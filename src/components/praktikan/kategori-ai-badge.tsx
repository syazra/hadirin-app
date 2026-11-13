import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';

type KategoriAiBadgeProps = {
  kategori: string | null | undefined;
};

export function KategoriAiBadge({ kategori }: KategoriAiBadgeProps) {
  if (!kategori) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.label}>Klasifikasi AI</Text>
      <Text style={styles.value}>{kategori}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.light.accentSoft,
    gap: Spacing.half,
  },
  label: {
    color: Colors.light.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  value: {
    color: Colors.light.accent,
    fontSize: 12,
    fontWeight: '700',
  },
});