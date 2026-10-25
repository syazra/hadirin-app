import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { AppProvider } from '@/context/app-context';
import { useApp } from '@/hooks/use-app';

function AppNavigator() {
  const { penggunaAktif } = useApp();

  return (
    <Stack screenOptions={{ headerTintColor: Colors.light.primary }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Protected guard={penggunaAktif?.peran === 'ASISTEN'}>
        <Stack.Screen name="(asisten)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={penggunaAktif?.peran === 'PRAKTIKAN'}>
        <Stack.Screen name="(praktikan)" options={{ headerShown: false }} />
        <Stack.Screen name="scan-qr" options={{ title: 'Scan QR' }} />
      </Stack.Protected>
      <Stack.Protected guard={penggunaAktif !== null}>
        <Stack.Screen name="sesi/[id]" options={{ title: 'Detail sesi' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
}
