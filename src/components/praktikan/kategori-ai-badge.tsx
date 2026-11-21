import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import type { KategoriIzin, StatusAi } from '@/types';

type Props = {
  kategori: KategoriIzin | null | undefined;
  statusAi?: StatusAi;
};

export function KategoriAiBadge({ kategori, statusAi }: Props) {
  const labelStatus = statusAi === 'SUKSES' && kategori
    ? 'Klasifikasi berhasil'
    : statusAi === 'SUKSES'
      ? 'Klasifikasi belum tersedia'
      : statusAi === 'GAGAL'
        ? 'Klasifikasi gagal'
        : 'Belum diklasifikasikan';

  if (!kategori && !statusAi) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.label}>Klasifikasi AI · {labelStatus}</Text>
      {kategori ? <Text style={styles.value}>{kategori}</Text> : <Text style={styles.empty}>Kategori belum tersedia</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: Colors.light.accentSoft, gap: Spacing.half },
  label: { color: Colors.light.textSecondary, fontSize: 10, fontWeight: '600' },
  value: { color: Colors.light.accent, fontSize: 12, fontWeight: '700' },
  empty: { color: Colors.light.textSecondary, fontSize: 11 },
});
