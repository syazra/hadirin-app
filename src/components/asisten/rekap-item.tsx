import { StyleSheet, Text, View } from 'react-native';

import { IconCheckCircle, IconClock } from '@/components/ui/icons';
import { StatusBadge } from '@/components/ui/status-badge';
import { getWarmPastelTone } from '@/constants/pastel';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';
import type { ItemRekapSesi } from '@/hooks/use-rekap-sesi';
import { formatWaktu } from '@/utils/format-waktu';

export type RekapItemProps = ItemRekapSesi;

export function RekapItem({
  nama,
  nim,
  statusKeanggotaan,
  statusRekap,
  aiBelumTersedia,
  waktuHadir,
  izin,
}: RekapItemProps) {
  const adalahIzinDisetujui =
    statusRekap === 'IZIN' || statusRekap === 'SAKIT';

  const sedangMenungguIzin =
    statusRekap === 'BELUM_HADIR' &&
    izin !== null &&
    izin.statusIzin === 'MENUNGGU';

  const teksWaktu =
    statusRekap === 'HADIR'
      ? waktuHadir
        ? formatWaktu(waktuHadir.toISOString())
        : 'Memproses waktu...'
      : adalahIzinDisetujui
        ? izin?.waktuPeriksa
          ? formatWaktu(izin.waktuPeriksa.toISOString())
          : 'Izin disetujui'
        : null;

  const tone = getWarmPastelTone(nama);

  return (
    <View style={styles.card}>
      <View style={[styles.avatar, { backgroundColor: tone.bg }]}>
        <Text style={[styles.initial, { color: tone.fg }]}>
          {nama.trim().charAt(0).toUpperCase() || '?'}
        </Text>
      </View>

      <View style={styles.info}>
        <View style={styles.namaRow}>
          <Text style={styles.nama} numberOfLines={1}>
            {nama}
          </Text>
          {statusKeanggotaan === 'NONAKTIF' && (
            <View style={styles.nonaktifTag}>
              <Text style={styles.nonaktifText}>Nonaktif</Text>
            </View>
          )}
        </View>

        <Text style={styles.nim}>{nim}</Text>

        {teksWaktu ? (
          <View style={styles.waktuRow}>
            {statusRekap === 'HADIR' ? (
              <IconCheckCircle size={12} color={Colors.light.success} />
            ) : (
              <IconClock size={12} color={Colors.light.primary} />
            )}
            <Text
              style={[
                styles.waktu,
                statusRekap !== 'HADIR' && styles.waktuIzin,
              ]}
              numberOfLines={1}
            >
              {teksWaktu}
            </Text>
          </View>
        ) : null}

        {aiBelumTersedia && (
          <Text style={styles.aiFallbackNote}>
            Klasifikasi AI belum tersedia
          </Text>
        )}
      </View>

      <View style={styles.badges}>
        {sedangMenungguIzin ? (
          <StatusBadge status="MENUNGGU" />
        ) : (
          <StatusBadge status={statusRekap} />
        )}
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
    borderRadius: Radii.md + 2,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.subtle,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  namaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nama: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14.5,
    color: Colors.light.text,
    flexShrink: 1,
  },
  nonaktifTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: Colors.light.backgroundElement,
  },
  nonaktifText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 10,
    color: Colors.light.textSecondary,
  },
  nim: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  waktuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  waktu: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11.5,
    color: Colors.light.success,
  },
  waktuIzin: {
    color: Colors.light.primary,
  },
  aiFallbackNote: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.light.warning,
    marginTop: 1,
  },
  badges: {
    alignItems: 'flex-end',
  },
});
