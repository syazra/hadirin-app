import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider } from '@/context/app-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Stack>
          <Stack.Screen name="index" options={{ title: 'Hadir.in' }} />
          <Stack.Screen name="(asisten)" options={{ headerShown: false }} />
          <Stack.Screen name="(praktikan)" options={{ headerShown: false }} />
          <Stack.Screen name="sesi/[id]" options={{ title: 'Detail sesi' }} />
          <Stack.Screen name="scan-qr" options={{ title: 'Scan QR' }} />
        </Stack>
      </AppProvider>
    </SafeAreaProvider>
  );
}
