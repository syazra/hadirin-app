import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import type { ItemRekapSesi } from '@/types';

export type RekapItemProps = ItemRekapSesi;

export function RekapItem({ pengguna, presensi }: RekapItemProps) {
  const waktu = new Date(presensi.waktuHadir).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.initial}>
          {pengguna.nama.charAt(0).toUpperCase()}
        </Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.nama}>{pengguna.nama}</Text>
        <Text style={styles.id}>{pengguna.idPengguna}</Text>
      </View>

      <View style={styles.badge}>
        <Text style={styles.waktu}>{waktu}</Text>
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
  info: { flex: 1, gap: 3 },
  nama: { fontSize: 14, fontWeight: '600', color: Colors.light.text },
  id: { fontSize: 12, color: Colors.light.textSecondary },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.light.successSoft,
  },
  waktu: { fontSize: 12, fontWeight: '600', color: Colors.light.success },
});
