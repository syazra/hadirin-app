import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  IconArchive,
  IconCalendar,
  IconChevronRight,
  IconEdit,
  IconUsers,
} from '@/components/ui/icons';
import { getWarmPastelTone } from '@/constants/pastel';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';
import type { Kelas } from '@/types';

type KelasCardProps = {
  kelas: Kelas;
  /** Jika tidak diberikan, kartu tidak bisa ditekan (mis. dipakai di halaman detail kelas). */
  onPress?: () => void;
  onEdit?: () => void;
  onArsip?: () => void;
  subjudul?: string;
  jumlahPeserta?: number;
  infoSesi?: string;
};

const KATA_PENGHUBUNG = new Set(['dan', 'di', 'ke', 'dari', 'untuk', 'yang']);

function buatInisialKelas(nama: string): string {
  const kata = nama
    .trim()
    .split(/\s+/)
    .map((bagian) => bagian.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, ''))
    .filter(
      (bagian) =>
        bagian.length > 0 && !KATA_PENGHUBUNG.has(bagian.toLowerCase()),
    );

  if (kata.length === 0) return '?';
  if (kata.length === 1) return kata[0].slice(0, 2).toUpperCase();

  return kata
    .slice(0, 2)
    .map((bagian) => bagian[0])
    .join('')
    .toUpperCase();
}

function formatTanggalSingkat(tanggal: Date | null | undefined): string {
  if (!tanggal) return 'Memproses…';
  return tanggal.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function KelasCard({
  kelas,
  onPress,
  onEdit,
  onArsip,
  subjudul,
  jumlahPeserta,
  infoSesi,
}: KelasCardProps) {
  const diarsipkan = kelas.diarsipkan;
  const inisial = buatInisialKelas(kelas.namaPraktikum);
  const tone = getWarmPastelTone(kelas.namaPraktikum);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={
        onPress ? `Buka detail kelas ${kelas.namaPraktikum}` : undefined
      }
      style={({ pressed }) => [
        styles.kartu,
        diarsipkan && styles.kartuDiarsipkan,
        pressed && onPress && styles.ditekan,
      ]}
    >
      <View style={styles.barisAtas}>
        <View style={[styles.ikonKotak, { backgroundColor: tone.bg }]}>
          <Text style={[styles.ikonInisial, { color: tone.fg }]}>
            {inisial}
          </Text>
        </View>

        <View style={styles.judulWrap}>
          <Text style={styles.nama} numberOfLines={2}>
            {kelas.namaPraktikum}
          </Text>
          {subjudul ? (
            <Text style={styles.subjudul} numberOfLines={1}>
              {subjudul}
            </Text>
          ) : null}
        </View>

        <View style={styles.topRight}>
          <View
            style={[
              styles.badge,
              diarsipkan ? styles.badgeArsip : styles.badgeAktif,
            ]}
          >
            <Text
              style={[
                styles.badgeTeks,
                diarsipkan ? styles.badgeTeksArsip : styles.badgeTeksAktif,
              ]}
            >
              {diarsipkan ? 'Arsip' : 'Aktif'}
            </Text>
          </View>
          {onPress ? (
            <IconChevronRight size={17} color={Colors.light.textSecondary} />
          ) : null}
        </View>
      </View>

      <View style={styles.chipsRow}>
        {jumlahPeserta !== undefined ? (
          <View style={styles.metaChip}>
            <IconUsers size={13} color={Colors.light.primary} />
            <Text style={styles.metaChipText}>{jumlahPeserta} praktikan</Text>
          </View>
        ) : null}

        {infoSesi ? (
          <View style={styles.metaChip}>
            <Text style={styles.metaChipText}>{infoSesi}</Text>
          </View>
        ) : null}

        <View style={styles.metaChip}>
          <IconCalendar size={13} color={Colors.light.warm} />
          <Text style={styles.metaChipText}>
            {formatTanggalSingkat(kelas.dibuatPada)}
          </Text>
        </View>
      </View>

      {!diarsipkan && (onEdit || onArsip) ? (
        <View style={styles.footer}>
          {onEdit ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Ubah kelas ${kelas.namaPraktikum}`}
              style={({ pressed }) => [
                styles.tombolAksi,
                styles.tombolEdit,
                pressed && styles.ditekan,
              ]}
            >
              <IconEdit size={13.5} color={Colors.light.text} />
              <Text style={styles.tombolEditTeks}>Ubah</Text>
            </Pressable>
          ) : null}

          {onArsip ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onArsip();
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Arsipkan kelas ${kelas.namaPraktikum}`}
              style={({ pressed }) => [
                styles.tombolAksi,
                styles.tombolArsip,
                pressed && styles.ditekan,
              ]}
            >
              <IconArchive size={13.5} color={Colors.light.danger} />
              <Text style={styles.tombolArsipTeks}>Arsipkan</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  kartu: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radii.xl - 2,
    padding: 16,
    gap: 12,
    ...Shadows.card,
  },
  kartuDiarsipkan: {
    opacity: 0.72,
    backgroundColor: Colors.light.backgroundElement,
  },
  ditekan: {
    opacity: 0.85,
  },
  barisAtas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ikonKotak: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ikonInisial: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  judulWrap: {
    flex: 1,
    gap: 2,
  },
  nama: {
    fontFamily: Fonts.sansBold,
    fontSize: 16.5,
    lineHeight: 22,
    color: Colors.light.text,
  },
  subjudul: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  badgeAktif: {
    backgroundColor: Colors.light.successSoft,
  },
  badgeArsip: {
    backgroundColor: Colors.light.border,
  },
  badgeTeks: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
  },
  badgeTeksAktif: {
    color: Colors.light.success,
  },
  badgeTeksArsip: {
    color: Colors.light.textSecondary,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.light.backgroundElement,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  metaChipText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  tombolAksi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.sm,
  },
  tombolEdit: {
    backgroundColor: Colors.light.backgroundElement,
  },
  tombolEditTeks: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.light.text,
  },
  tombolArsip: {
    backgroundColor: Colors.light.dangerSoft,
  },
  tombolArsipTeks: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.light.danger,
  },
});
