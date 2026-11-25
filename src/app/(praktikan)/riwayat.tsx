import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { RiwayatItem } from '@/components/praktikan/riwayat-item';
import { LayarPersiapan } from '@/components/shared/layar-persiapan';
import { BrandGradient } from '@/components/ui/brand-gradient';
import { EmptyState } from '@/components/ui/empty-state';
import { IconCheckCircle } from '@/components/ui/icons';
import { LoadingState } from '@/components/ui/loading-state';
import { EnterView, PopBadge } from '@/components/ui/motion';
import { getStaggerDelay } from '@/constants/motion';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useRiwayatKehadiran } from '@/hooks/use-riwayat-kehadiran';

export default function RiwayatScreen() {
  const { pengguna } = useAuth();
  const { riwayat, loading, error } = useRiwayatKehadiran(pengguna?.uid ?? '');
  const jumlahHadir = riwayat.length;

  if (!pengguna || pengguna.peran !== 'PRAKTIKAN') {
    return (
      <LayarPersiapan
        judul="Riwayat kehadiran"
        pesan="Masuk sebagai praktikan untuk melihat riwayat presensi."
      />
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {riwayat.length > 0 && (
        <EnterView scaleFrom={0.97}>
          <BrandGradient
            variant="emerald"
            style={[styles.ringkasan, Shadows.emeraldGlow]}
          >
            <View style={styles.ringkasanLeft}>
              <PopBadge triggerKey={jumlahHadir}>
                <Text style={styles.ringkasanCount}>{jumlahHadir}</Text>
              </PopBadge>
              <Text style={styles.ringkasanLabel}>Sesi Hadir</Text>
            </View>
            <View style={styles.ringkasanMedallion}>
              <IconCheckCircle size={28} color="#FFFFFF" strokeWidth={2.1} />
            </View>
          </BrandGradient>
        </EnterView>
      )}

      {loading ? (
        <LoadingState pesan="Memuat riwayat presensi..." layarPenuh={false} />
      ) : riwayat.length > 0 ? (
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.daftar}>
            {riwayat.map((item, index) => (
              <EnterView
                key={item.presensi.idPresensi}
                delay={getStaggerDelay(index, 70)}
              >
                <RiwayatItem {...item} />
              </EnterView>
            ))}
          </View>
        </>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <View style={styles.emptyWrap}>
          <EmptyState
            judul="Belum ada catatan kehadiran"
            pesan="Presensi yang kamu lakukan akan muncul di sini."
          />
        </View>
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
    gap: 16,
    paddingBottom: 36,
    flexGrow: 1,
  },
  ringkasan: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: Radii.xl,
  },
  ringkasanLeft: {
    gap: 2,
  },
  ringkasanCount: {
    fontFamily: Fonts.sansBold,
    fontSize: 34,
    lineHeight: 40,
    color: '#FFFFFF',
  },
  ringkasanLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13.5,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  ringkasanMedallion: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  daftar: {
    gap: 12,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  error: {
    fontFamily: Fonts.sansMedium,
    color: Colors.light.danger,
    fontSize: 12.5,
    lineHeight: 18,
  },
});
