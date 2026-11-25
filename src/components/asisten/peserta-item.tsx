import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getWarmPastelTone } from '@/constants/pastel';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';
import type { Keanggotaan } from '@/types';

type PesertaItemProps = {
  peserta: Keanggotaan;
  /** true jika kelas sudah diarsipkan sehingga status peserta tidak dapat diubah. */
  kelasDiarsipkan?: boolean;
  loading?: boolean;
  onNonaktifkan?: () => void;
  onAktifkan?: () => void;
};

export function PesertaItem({
  peserta,
  kelasDiarsipkan = false,
  loading = false,
  onNonaktifkan,
  onAktifkan,
}: PesertaItemProps) {
  const aktif = peserta.status === 'AKTIF';
  const tone = getWarmPastelTone(peserta.nama);
  const inisial = peserta.nama.trim().charAt(0).toUpperCase() || '?';

  return (
    <View style={[styles.kartu, !aktif && styles.kartuNonaktif]}>
      <View style={[styles.avatar, { backgroundColor: tone.bg }]}>
        <Text style={[styles.avatarTeks, { color: tone.fg }]}>{inisial}</Text>
      </View>

      <View style={styles.info}>
        <View style={styles.barisNama}>
          <Text style={styles.nama} numberOfLines={1}>
            {peserta.nama}
          </Text>

          <View
            style={[
              styles.badge,
              aktif ? styles.badgeAktif : styles.badgeNonaktif,
            ]}
          >
            <Text
              style={[
                styles.badgeTeks,
                aktif ? styles.badgeTeksAktif : styles.badgeTeksNonaktif,
              ]}
            >
              {aktif ? 'Aktif' : 'Nonaktif'}
            </Text>
          </View>
        </View>

        <Text style={styles.nim}>{peserta.nim}</Text>
      </View>

      {!kelasDiarsipkan ? (
        aktif && onNonaktifkan ? (
          <Pressable
            onPress={onNonaktifkan}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={`Nonaktifkan ${peserta.nama}`}
            accessibilityState={{ disabled: loading }}
            style={({ pressed }) => [
              styles.tombol,
              styles.tombolBahaya,
              pressed && !loading && styles.ditekan,
              loading && styles.disabled,
            ]}
          >
            <Text style={styles.tombolBahayaTeks}>Nonaktifkan</Text>
          </Pressable>
        ) : !aktif && onAktifkan ? (
          <Pressable
            onPress={onAktifkan}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={`Aktifkan kembali ${peserta.nama}`}
            accessibilityState={{ disabled: loading }}
            style={({ pressed }) => [
              styles.tombol,
              styles.tombolSekunder,
              pressed && !loading && styles.ditekan,
              loading && styles.disabled,
            ]}
          >
            <Text style={styles.tombolSekunderTeks}>Aktifkan</Text>
          </Pressable>
        ) : null
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  kartu: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 14,
    borderRadius: Radii.md + 2,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    ...Shadows.subtle,
  },
  kartuNonaktif: {
    opacity: 0.68,
    backgroundColor: Colors.light.backgroundElement,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTeks: {
    fontFamily: Fonts.sansBold,
    fontSize: 15,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  barisNama: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  nama: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14.5,
    color: Colors.light.text,
  },
  nim: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  badgeAktif: {
    backgroundColor: Colors.light.successSoft,
  },
  badgeNonaktif: {
    backgroundColor: Colors.light.border,
  },
  badgeTeks: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 10.5,
  },
  badgeTeksAktif: {
    color: Colors.light.success,
  },
  badgeTeksNonaktif: {
    color: Colors.light.textSecondary,
  },
  tombol: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.sm,
  },
  tombolSekunder: {
    backgroundColor: Colors.light.backgroundElement,
  },
  tombolSekunderTeks: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.light.text,
  },
  tombolBahaya: {
    backgroundColor: Colors.light.dangerSoft,
  },
  tombolBahayaTeks: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.light.danger,
  },
  ditekan: {
    opacity: 0.78,
  },
  disabled: {
    opacity: 0.55,
  },
});
