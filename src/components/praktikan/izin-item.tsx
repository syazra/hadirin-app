import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconChevronRight, IconClock } from '@/components/ui/icons';
import { StatusBadge } from '@/components/ui/status-badge';
import type { StatusIzin } from '@/constants/status-izin';
import { Colors, Fonts, Radii, Shadows, Spacing } from '@/constants/theme';

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
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {namaSesi}
        </Text>
        <View style={styles.timeRow}>
          <IconClock size={12.5} color={Colors.light.textSecondary} />
          <Text style={styles.time} numberOfLines={1}>
            {waktuSesi}
          </Text>
        </View>
      </View>

      <View style={styles.rightCluster}>
        <StatusBadge status={status} />
        <IconChevronRight size={17} color={Colors.light.textSecondary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two + 2,
    padding: 15,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    ...Shadows.card,
  },
  content: {
    flex: 1,
    gap: 5,
  },
  title: {
    fontFamily: Fonts.sansBold,
    color: Colors.light.text,
    fontSize: 14.5,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  time: {
    fontFamily: Fonts.sans,
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
  rightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pressed: {
    opacity: 0.88,
  },
});
