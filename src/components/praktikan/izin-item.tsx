import { Pressable, StyleSheet, Text, View } from 'react-native';

import { STATUS_IZIN, type StatusIzin } from '@/constants/status-izin';
import { Colors, Spacing } from '@/constants/theme';

type IzinItemProps = {
  namaSesi: string;
  waktuSesi: string;
  status: StatusIzin;
  onPress: () => void;
};

export function IzinItem({
  namaSesi,
  waktuSesi,
  status,
  onPress,
}: IzinItemProps) {
  const tampilanStatus = STATUS_IZIN[status];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{namaSesi}</Text>
        <Text style={styles.time}>{waktuSesi}</Text>
      </View>

      <View style={[styles.badge, { backgroundColor: tampilanStatus.background }]}>
        <Text style={[styles.badgeText, { color: tampilanStatus.color }]}>
          {tampilanStatus.label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  content: {
    flex: 1,
    gap: 5,
  },
  title: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: '700',
  },
  time: {
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});