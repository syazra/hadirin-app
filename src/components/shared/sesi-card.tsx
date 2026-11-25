import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/app-card';
import {
  IconChevronRight,
  IconClock,
  IconMapPin,
} from '@/components/ui/icons';
import { StatusBadge } from '@/components/ui/status-badge';
import { Colors, Fonts } from '@/constants/theme';
import type { Sesi } from '@/types';

type SesiCardProps = {
  sesi: Sesi;
  namaPraktikum?: string;
  onPress: () => void;
};

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

function formatJam(tanggal: Date): string {
  const jam = String(tanggal.getHours()).padStart(2, '0');
  const menit = String(tanggal.getMinutes()).padStart(2, '0');
  return `${jam}.${menit}`;
}

function formatRentangJam(waktuMulai: Date, waktuSelesai: Date | null): string {
  const jamMulai = formatJam(waktuMulai);
  if (!waktuSelesai) {
    return `${jamMulai} WIB`;
  }
  return `${jamMulai}–${formatJam(waktuSelesai)} WIB`;
}

export function SesiCard({ sesi, namaPraktikum, onPress }: SesiCardProps) {
  const waktuTampil = formatRentangJam(sesi.waktuMulai, sesi.waktuSelesai);
  const tone =
    sesi.statusSesi === 'DIBUKA'
      ? { bg: Colors.light.successSoft, fg: Colors.light.success }
      : sesi.statusSesi === 'BELUM_DIBUKA'
        ? { bg: Colors.light.warmSoft, fg: Colors.light.warm }
        : { bg: Colors.light.backgroundElement, fg: Colors.light.textSecondary };

  return (
    <AppCard onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.dateBox, { backgroundColor: tone.bg }]}>
          <Text style={[styles.dateNum, { color: tone.fg }]}>
            {sesi.waktuMulai.getDate()}
          </Text>
          <Text style={[styles.dateMonth, { color: tone.fg }]}>
            {BULAN_SINGKAT[sesi.waktuMulai.getMonth()]}
          </Text>
        </View>

        <View style={styles.body}>
          <View style={styles.topRow}>
            {namaPraktikum ? (
              <Text style={styles.kelas} numberOfLines={1}>
                {namaPraktikum}
              </Text>
            ) : (
              <View />
            )}
            <StatusBadge status={sesi.statusSesi} />
          </View>

          <Text style={styles.nama} numberOfLines={2}>
            {sesi.judul}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <IconMapPin size={13} color={Colors.light.teal} />
              <Text style={styles.metaText} numberOfLines={1}>
                {sesi.lokasi}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <IconClock size={13} color={Colors.light.textSecondary} />
              <Text style={styles.metaText} numberOfLines={1}>
                {waktuTampil}
              </Text>
            </View>
          </View>
        </View>

        <IconChevronRight size={18} color={Colors.light.textSecondary} />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateBox: {
    width: 50,
    height: 58,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNum: {
    fontFamily: Fonts.sansBold,
    fontSize: 19,
    lineHeight: 23,
  },
  dateMonth: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 10.5,
    textTransform: 'uppercase',
  },
  body: {
    flex: 1,
    gap: 5,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  kelas: {
    flex: 1,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11.5,
    color: Colors.light.primary,
  },
  nama: {
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.light.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
});
