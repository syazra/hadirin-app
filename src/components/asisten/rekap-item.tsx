import { StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '@/components/ui/status-badge';
import { Colors } from '@/constants/theme';
import type { ItemRekapSesi } from '@/hooks/use-rekap-sesi';
import { formatWaktu } from '@/utils/format-waktu';

export type RekapItemProps = ItemRekapSesi;

export function RekapItem({
  nama,
  nim,
  statusKeanggotaan,
  statusRekap,
  waktuHadir,
  izin,
}: RekapItemProps) {
  const teksWaktu =
    statusRekap === 'HADIR'
      ? waktuHadir
        ? formatWaktu(waktuHadir.toISOString())
        : 'Memproses waktu...'
      : statusRekap === 'IZIN'
        ? izin?.waktuPeriksa
          ? `Disetujui · ${formatWaktu(izin.waktuPeriksa.toISOString())}`
          : 'Izin disetujui'
        : null;

  const tampilkanStatusIzinTerpisah =
    izin !== null &&
    (izin.statusIzin === 'MENUNGGU' || izin.statusIzin === 'DITOLAK');

  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.initial}>{nama.charAt(0).toUpperCase()}</Text>
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
        {teksWaktu && <Text style={styles.waktu}>{teksWaktu}</Text>}
      </View>

      <View style={styles.badges}>
        <StatusBadge status={statusRekap} />
        {tampilkanStatusIzinTerpisah && izin && (
          <StatusBadge status={izin.statusIzin} />
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
    borderRadius: 14,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primarySoft,
  },
  initial: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  namaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nama: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    flexShrink: 1,
  },
  nonaktifTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: Colors.light.backgroundSelected,
  },
  nonaktifText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  nim: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  waktu: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.success,
    marginTop: 2,
  },
  badges: {
    alignItems: 'flex-end',
    gap: 6,
  },
});