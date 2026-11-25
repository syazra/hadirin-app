import { StyleSheet, Text, View } from 'react-native';

import { IconCheckCircle, IconMapPin } from '@/components/ui/icons';
import { StatusBadge } from '@/components/ui/status-badge';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';
import type { Presensi, Sesi } from '@/types';
import { formatWaktu } from '@/utils/format-waktu';

export type RiwayatItemProps = { sesi: Sesi; presensi: Presensi };

const BULAN_SINGKAT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

export function RiwayatItem({ sesi, presensi }: RiwayatItemProps) {
  const waktuCheckin = presensi.waktuHadir
    ? formatWaktu(presensi.waktuHadir.toISOString())
    : 'Menunggu konfirmasi';

  return (
    <View style={styles.card}>
      <View style={styles.dateTile}>
        <Text style={styles.dateNum}>{sesi.waktuMulai.getDate()}</Text>
        <Text style={styles.dateMonth}>
          {BULAN_SINGKAT[sesi.waktuMulai.getMonth()]}
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.nama} numberOfLines={2}>
            {sesi.judul}
          </Text>
          <StatusBadge status="HADIR" />
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <IconMapPin size={12.5} color={Colors.light.teal} />
            <Text style={styles.metaText} numberOfLines={1}>
              {sesi.lokasi}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <IconCheckCircle size={12.5} color={Colors.light.success} />
            <Text style={styles.metaText} numberOfLines={1}>
              {waktuCheckin}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    ...Shadows.card,
  },
  dateTile: {
    width: 48,
    height: 54,
    borderRadius: 14,
    backgroundColor: Colors.light.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNum: {
    fontFamily: Fonts.sansBold,
    fontSize: 18,
    lineHeight: 22,
    color: Colors.light.success,
  },
  dateMonth: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 10.5,
    color: Colors.light.success,
    textTransform: 'uppercase',
  },
  body: {
    flex: 1,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  nama: {
    flex: 1,
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.light.text,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11.5,
    color: Colors.light.textSecondary,
  },
});
