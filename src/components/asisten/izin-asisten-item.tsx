import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconChevronRight, IconSparkles } from '@/components/ui/icons';
import { StatusBadge } from '@/components/ui/status-badge';
import { getWarmPastelTone } from '@/constants/pastel';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';
import type { Izin } from '@/types';

type Props = { izin: Izin; namaPraktikan?: string; onPress: () => void };

function formatTanggalSingkat(tanggal: Date | null | undefined): string {
  if (!tanggal) return 'Baru saja';
  return tanggal.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function IzinAsistenItem({ izin, namaPraktikan, onPress }: Props) {
  const namaTampil = namaPraktikan ?? 'Praktikan';
  const tone = getWarmPastelTone(namaTampil);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.topRow}>
        <View style={[styles.avatar, { backgroundColor: tone.bg }]}>
          <Text style={[styles.avatarText, { color: tone.fg }]}>
            {namaTampil.trim().charAt(0).toUpperCase() || '?'}
          </Text>
        </View>

        <View style={styles.flex}>
          <Text style={styles.name} numberOfLines={1}>
            {namaTampil}
          </Text>
          <Text style={styles.date}>{formatTanggalSingkat(izin.dibuatPada)}</Text>
        </View>

        <StatusBadge status={izin.statusIzin} />
      </View>

      <View style={styles.reasonBox}>
        <Text style={styles.reason} numberOfLines={2}>
          {izin.alasan}
        </Text>
      </View>

      <View style={styles.bottomRow}>
        {izin.kategoriAi ? (
          <View style={styles.aiPill}>
            <IconSparkles size={12} color={Colors.light.brandMid} />
            <Text style={styles.aiPillText}>{izin.kategoriAi}</Text>
          </View>
        ) : (
          <View />
        )}

        <IconChevronRight size={17} color={Colors.light.textSecondary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radii.lg,
    padding: 15,
    gap: 10,
    ...Shadows.card,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Fonts.sansBold,
    fontSize: 15,
  },
  flex: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: Fonts.sansBold,
    color: Colors.light.text,
    fontSize: 14.5,
  },
  date: {
    fontFamily: Fonts.sans,
    color: Colors.light.textSecondary,
    fontSize: 11.5,
  },
  reasonBox: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: Radii.sm + 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  reason: {
    fontFamily: Fonts.sans,
    color: Colors.light.text,
    fontSize: 13,
    lineHeight: 19,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  aiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.light.brandMidSoft,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  aiPillText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    color: Colors.light.brandMid,
  },
});
