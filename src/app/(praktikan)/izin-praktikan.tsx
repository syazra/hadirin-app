import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { STATUS_IZIN } from '@/constants/status-izin';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useIzinPengguna } from '@/hooks/use-izin-pengguna';

export default function IzinPraktikanScreen() {
  const router = useRouter();
  const { pengguna } = useAuth();
  const { izin, loading, error } = useIzinPengguna(pengguna?.uid);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
    >
      <Text style={styles.title}>Riwayat Pengajuan Izin</Text>
      <Text style={styles.subtitle}>
        Pantau status pengajuan izin praktikum kamu.
      </Text>

      {loading ? (
        <ActivityIndicator color={Colors.light.primary} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : izin.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Belum ada pengajuan izin</Text>
          <Text style={styles.subtitle}>
            Pengajuan izin yang kamu kirim akan muncul di sini.
          </Text>
        </View>
      ) : (
        izin.map((item) => {
          const status = STATUS_IZIN[item.statusIzin];

          return (
            <Pressable
              key={item.idIzin}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: '/izin/[id]',
                  params: { id: item.idIzin },
                })
              }
            >
              <Text style={styles.cardTitle}>Pengajuan Izin</Text>
              <Text style={styles.info}>Sesi: {item.sesiId}</Text>
              <Text style={styles.info} numberOfLines={2}>
                Alasan: {item.alasan}
              </Text>

              <View
                style={[
                  styles.badge,
                  { backgroundColor: status.background },
                ]}
              >
                <Text style={{ color: status.color, fontWeight: '700' }}>
                  {status.label}
                </Text>
              </View>

              <Text style={styles.detail}>Lihat detail →</Text>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.light.background },
  container: { padding: Spacing.three, gap: Spacing.three },
  title: { fontSize: 22, fontWeight: '700', color: Colors.light.text },
  subtitle: { fontSize: 13, color: Colors.light.textSecondary },
  card: {
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    gap: 9,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.light.text },
  info: { fontSize: 13, color: Colors.light.textSecondary },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  detail: { color: Colors.light.primary, fontSize: 12, fontWeight: '600' },
  empty: { padding: 20, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: Colors.light.text },
  error: { color: Colors.light.danger },
});