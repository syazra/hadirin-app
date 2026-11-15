import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Izin } from '@/types';
import { Colors, Spacing } from '@/constants/theme';
import { STATUS_IZIN } from '@/constants/status-izin';

type Props = { izin: Izin; namaPraktikan?: string; onPress: () => void };

export function IzinAsistenItem({ izin, namaPraktikan, onPress }: Props) {
  const status = STATUS_IZIN[izin.statusIzin];

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text style={styles.name}>{namaPraktikan ?? `Praktikan ${izin.uid.slice(0, 8)}`}</Text>
          <Text style={styles.date}>
            {izin.dibuatPada?.toLocaleString('id-ID') ?? 'Waktu tidak tersedia'}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: status.background }]}>
          <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>
      <Text style={styles.reason} numberOfLines={2}>{izin.alasan}</Text>
      <Text style={styles.detail}>Lihat detail pengajuan  ›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.light.card, borderWidth: 1, borderColor: Colors.light.border, borderRadius: 14, padding: Spacing.three, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flex: { flex: 1, gap: 4 },
  name: { color: Colors.light.text, fontWeight: '700', fontSize: 14 },
  date: { color: Colors.light.textSecondary, fontSize: 11 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  reason: { color: Colors.light.text, fontSize: 13, lineHeight: 19 },
  detail: { color: Colors.light.primary, fontWeight: '700', fontSize: 12 },
});