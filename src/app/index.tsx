import { Redirect } from 'expo-router';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { tentukanTujuanNavigasiAuth } from '@/utils/tujuan-navigasi-auth';

export default function HomeScreen() {
  const {
    pengguna,
    loading,
    profilBelumLengkap,
  } = useAuth();
  const tujuan = tentukanTujuanNavigasiAuth({
    pengguna,
    loading,
    profilBelumLengkap,
  });

  if (!tujuan) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator
          size="large"
          color={Colors.light.primary}
        />
        <Text style={styles.helper}>
          Memeriksa sesi akun...
        </Text>
      </SafeAreaView>
    );
  }

  return <Redirect href={tujuan} />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    backgroundColor: Colors.light.background,
  },
  helper: {
    color: Colors.light.textSecondary,
    fontSize: 14,
  },
});
