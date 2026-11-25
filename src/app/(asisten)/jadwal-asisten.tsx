import { useRouter } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';

import { JadwalList } from '@/components/shared/jadwal-list';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useJadwalAsisten } from '@/hooks/use-jadwal-asisten';

export default function JadwalAsistenScreen() {
  const router = useRouter();
  const { pengguna, loading: authLoading } = useAuth();
  const {
    sesi,
    loading: jadwalLoading,
    error,
    muatUlang,
  } = useJadwalAsisten(pengguna?.uid ?? null);

  const sedangMemuat = authLoading || jadwalLoading;

  if (sedangMemuat) {
    return <LoadingState pesan="Memuat jadwal praktikum..." />;
  }

  if (error) {
    return <ErrorState judul="Gagal Memuat Jadwal" pesan={error} onCobaLagi={muatUlang} />;
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={muatUlang}
          tintColor={Colors.light.primary}
        />
      }
    >
      <JadwalList
        sesi={sesi}
        onPilihSesi={(idSesi) =>
          router.push({
            pathname: '/sesi/[id]',
            params: { id: idSesi },
          })
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: 20,
    paddingTop: 14,
    paddingBottom: 32,
    flexGrow: 1,
  },
});
