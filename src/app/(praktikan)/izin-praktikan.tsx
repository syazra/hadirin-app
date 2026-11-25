import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import {
  IconCalendar,
  IconChevronRight,
  IconSparkles,
} from '@/components/ui/icons';
import { LoadingState } from '@/components/ui/loading-state';
import { EnterView, PressableScale } from '@/components/ui/motion';
import { StatusBadge } from '@/components/ui/status-badge';
import { getStaggerDelay } from '@/constants/motion';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useIzinPengguna } from '@/hooks/use-izin-pengguna';

function formatTanggalSingkat(tanggal: Date | null | undefined): string {
  if (!tanggal) return 'Baru saja';
  return tanggal.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function IzinPraktikanScreen() {
  const router = useRouter();
  const { pengguna } = useAuth();
  const { izin, loading, error } = useIzinPengguna(pengguna?.uid);

  if (loading) {
    return <LoadingState pesan="Memuat daftar pengajuan izin..." />;
  }

  if (error) {
    return <ErrorState judul="Gagal memuat izin" pesan={error} />;
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {izin.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            judul="Belum ada pengajuan izin"
            pesan="Pengajuan izin yang kamu kirim akan muncul di sini."
          />
        </View>
      ) : (
        izin.map((item, index) => (
          <EnterView key={item.idIzin} delay={getStaggerDelay(index)}>
            <PressableScale
              scaleTo={0.98}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: '/izin/[id]',
                  params: { id: item.idIzin },
                })
              }
            >
              <View style={styles.topRow}>
                <View style={styles.datePill}>
                  <IconCalendar size={12.5} color={Colors.light.warm} />
                  <Text style={styles.dateText}>
                    {formatTanggalSingkat(item.dibuatPada)}
                  </Text>
                </View>
                <StatusBadge status={item.statusIzin} />
              </View>

              <View style={styles.reasonBox}>
                <Text style={styles.reason} numberOfLines={2}>
                  {item.alasan}
                </Text>
              </View>

              <View style={styles.bottomRow}>
                <View style={styles.chipsLeft}>
                  <View style={styles.sesiChip}>
                    <Text style={styles.sesiChipText} numberOfLines={1}>
                      {item.sesiId}
                    </Text>
                  </View>

                  {item.kategoriAi ? (
                    <View style={styles.aiChip}>
                      <IconSparkles size={11.5} color={Colors.light.brandMid} />
                      <Text style={styles.aiChipText}>{item.kategoriAi}</Text>
                    </View>
                  ) : null}
                </View>

                <IconChevronRight size={17} color={Colors.light.textSecondary} />
              </View>
            </PressableScale>
          </EnterView>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    padding: 20,
    paddingTop: 14,
    paddingBottom: 32,
    gap: 12,
    flexGrow: 1,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    padding: 15,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    gap: 10,
    ...Shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  reasonBox: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: Radii.sm + 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  reason: {
    fontFamily: Fonts.sans,
    fontSize: 13.5,
    lineHeight: 19,
    color: Colors.light.text,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  chipsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  sesiChip: {
    backgroundColor: Colors.light.primarySoft,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  sesiChipText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.light.primary,
  },
  aiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.brandMidSoft,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  aiChipText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    color: Colors.light.brandMid,
  },
});
