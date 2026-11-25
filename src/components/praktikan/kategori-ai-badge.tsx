import { StyleSheet, Text, View } from 'react-native';

import { IconSparkles } from '@/components/ui/icons';
import { Colors, Fonts, Radii } from '@/constants/theme';
import type { KategoriIzin, StatusAi } from '@/types';
import { VERSI_KATEGORI_AI } from '@/utils/kategori-izin';

type Props = {
  kategori: KategoriIzin | null | undefined;
  statusAi?: StatusAi;
  versiKategoriAi?: string | null;
};

export function KategoriAiBadge({
  kategori,
  statusAi,
  versiKategoriAi,
}: Props) {
  const labelStatus =
    statusAi === 'SUKSES' && kategori
      ? 'Selesai'
      : statusAi === 'SUKSES'
        ? 'Belum tersedia'
        : statusAi === 'GAGAL'
          ? 'Gagal'
          : 'Menunggu';

  if (!kategori && !statusAi) return null;

  return (
    <View style={styles.badge}>
      <View style={styles.topRow}>
        <View style={styles.pill}>
          <IconSparkles size={13} color={Colors.light.brandMid} />
          <Text style={styles.value}>{kategori ?? 'Belum dikategorikan'}</Text>
        </View>
        <Text style={styles.statusText}>{labelStatus}</Text>
      </View>

      {statusAi === 'SUKSES' &&
      kategori &&
      versiKategoriAi !== VERSI_KATEGORI_AI ? (
        <Text style={styles.empty}>
          Kebijakan lama · perlu klasifikasi ulang
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'stretch',
    padding: 12,
    borderRadius: Radii.md,
    backgroundColor: Colors.light.brandMidSoft,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  value: {
    fontFamily: Fonts.sansBold,
    color: Colors.light.brandMid,
    fontSize: 13.5,
  },
  statusText: {
    fontFamily: Fonts.sansSemiBold,
    color: Colors.light.textSecondary,
    fontSize: 11.5,
  },
  empty: {
    fontFamily: Fonts.sans,
    color: Colors.light.textSecondary,
    fontSize: 11.5,
  },
});
