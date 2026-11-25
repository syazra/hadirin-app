import { StyleSheet, Text, View } from 'react-native';

import { IconCalendar } from '@/components/ui/icons';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';

interface BerandaGreetingProps {
  nama?: string | null;
  fallbackNama?: string;
}

export function BerandaGreeting({
  nama,
  fallbackNama = 'Pengguna',
}: BerandaGreetingProps) {
  const namaDepan = (nama ?? '').trim().split(/\s+/)[0] || fallbackNama;
  const tanggalLabel = new Date()
    .toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
    .replace('.', '');

  return (
    <View style={styles.row}>
      <Text style={styles.greeting} numberOfLines={1}>
        Halo, {namaDepan}
      </Text>

      <View style={styles.datePill}>
        <IconCalendar size={13} color={Colors.light.warm} />
        <Text style={styles.dateText}>{tanggalLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  greeting: {
    flex: 1,
    fontFamily: Fonts.sansBold,
    fontSize: 21,
    lineHeight: 26,
    letterSpacing: -0.4,
    color: Colors.light.text,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radii.pill,
    paddingHorizontal: 11,
    paddingVertical: 6,
    ...Shadows.subtle,
  },
  dateText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 15,
    color: Colors.light.text,
  },
});
