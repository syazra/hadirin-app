import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { StackHeader } from '@/components/ui/stack-header';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

export default function AsistenLayout() {
  const { pengguna, loading, profilBelumLengkap } = useAuth();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.light.primary} />
      </View>
    );
  }

  if (!pengguna || profilBelumLengkap || pengguna.peran !== 'ASISTEN') {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        animation: 'slide_from_right',
        animationDuration: 260,
        contentStyle: {
          backgroundColor: Colors.light.background,
        },
        header: ({ navigation, options, back }) => (
          <StackHeader navigation={navigation} options={options} back={back} />
        ),
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="kelas" options={{ title: 'Praktikum' }} />
      <Stack.Screen name="jadwal-asisten" options={{ title: 'Jadwal' }} />
      <Stack.Screen name="rekap" options={{ title: 'Rekap Kehadiran' }} />
      <Stack.Screen name="izin-asisten" options={{ title: 'Perizinan' }} />
      <Stack.Screen name="maps" options={{ title: 'Peta Lab' }} />
      <Stack.Screen name="laboratorium" options={{ title: 'Laboratorium' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
});
