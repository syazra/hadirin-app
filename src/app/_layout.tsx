import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
  useFonts,
} from '@expo-google-fonts/space-grotesk';
import { Stack } from 'expo-router';
import { hideAsync, preventAutoHideAsync } from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors, Fonts } from '@/constants/theme';
import { AppProvider } from '@/context/app-context';
import { AuthProvider } from '@/context/auth-context';
import { useAuth } from '@/hooks/use-auth';

void preventAutoHideAsync();

function AppNavigator() {
  const { pengguna, loading, profilBelumLengkap } = useAuth();

  return (
    <Stack
      screenOptions={{
        headerTintColor: Colors.light.primary,
        headerTitleStyle: {
          fontFamily: Fonts.sansBold,
          color: Colors.light.text,
        },
        headerStyle: {
          backgroundColor: Colors.light.background,
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: Colors.light.background,
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />

      {/* Route autentikasi */}
      <Stack.Protected
        guard={!loading && (!pengguna || profilBelumLengkap)}
        redirectTo="/"
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>

      {/* Halaman Asisten */}
      <Stack.Protected
        guard={!loading && pengguna?.peran === 'ASISTEN' && !profilBelumLengkap}
        redirectTo="/"
      >
        <Stack.Screen name="(asisten)" options={{ headerShown: false }} />
        <Stack.Screen name="kelas/[id]" options={{ title: 'Detail kelas' }} />
      </Stack.Protected>

      {/* Halaman Praktikan */}
      <Stack.Protected
        guard={!loading && pengguna?.peran === 'PRAKTIKAN' && !profilBelumLengkap}
        redirectTo="/"
      >
        <Stack.Screen name="(praktikan)" options={{ headerShown: false }} />
        <Stack.Screen name="scan-qr" options={{ title: 'Scan QR' }} />
        <Stack.Screen name="izin/ajukan" options={{ title: 'Ajukan izin' }} />
      </Stack.Protected>

      {/* Detail sesi */}
      <Stack.Protected
        guard={!loading && !!pengguna && !profilBelumLengkap}
        redirectTo="/"
      >
        <Stack.Screen name="sesi/[id]" options={{ title: 'Detail sesi' }} />
        <Stack.Screen name="izin/[id]" options={{ title: 'Detail izin' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppProvider>
          <AppNavigator />
        </AppProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}