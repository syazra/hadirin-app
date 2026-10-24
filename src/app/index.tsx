import { Redirect } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IdentitasPicker } from '@/components/shared/identitas-picker';
import { Colors, Spacing } from '@/constants/theme';
import { useApp } from '@/hooks/use-app';

export default function HomeScreen() {
  const { pengguna, penggunaAktif, pilihIdentitas, gantiPeran } = useApp();

  if (penggunaAktif) {
    return (
      <Redirect href={penggunaAktif.peran === 'ASISTEN' ? '/(asisten)/jadwal-asisten' : '/(praktikan)/jadwal-praktikan'} />
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.brand}>Hadir.in</Text>

        <IdentitasPicker
          pengguna={pengguna}
          penggunaAktif={penggunaAktif}
          onPilihIdentitas={pilihIdentitas}
          onGantiPeran={gantiPeran}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.light.background },
  content: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    padding: Spacing.four,
    gap: Spacing.four,
  },
  brand: { color: Colors.light.primary, fontSize: 28, fontWeight: '800' },
});
