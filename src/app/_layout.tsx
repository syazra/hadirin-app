import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { Stack } from 'expo-router';
import { hideAsync, preventAutoHideAsync } from 'expo-splash-screen';
import { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  type TextProps,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { StackHeader } from '@/components/ui/stack-header';
import { Colors } from '@/constants/theme';
import { AppProvider } from '@/context/app-context';
import { AuthProvider } from '@/context/auth-context';
import { NotificationProvider } from '@/context/notification-context';
import { useAuth } from '@/hooks/use-auth';

interface TextWithDefaults {
  defaultProps?: TextProps;
}

interface TextInputWithDefaults {
  defaultProps?: TextInputProps;
}

const TextComponent = Text as unknown as TextWithDefaults;
TextComponent.defaultProps = {
  ...TextComponent.defaultProps,
  style: [{ includeFontPadding: false }, TextComponent.defaultProps?.style],
};

const TextInputComponent = TextInput as unknown as TextInputWithDefaults;
TextInputComponent.defaultProps = {
  ...TextInputComponent.defaultProps,
  style: [{ includeFontPadding: false }, TextInputComponent.defaultProps?.style],
};

void preventAutoHideAsync();

function AppNavigator() {
  const { pengguna, loading, profilBelumLengkap } = useAuth();

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
        <Stack.Screen
          name="scan-qr"
          options={{ title: 'Scan QR', animation: 'fade_from_bottom' }}
        />
        <Stack.Screen
          name="izin/ajukan"
          options={{ title: 'Ajukan izin', animation: 'fade_from_bottom' }}
        />
      </Stack.Protected>

      {/* Detail sesi & izin */}
      <Stack.Protected
        guard={!loading && !!pengguna && !profilBelumLengkap}
        redirectTo="/"
      >
        <Stack.Screen name="sesi/[id]" options={{ title: 'Detail Sesi' }} />
        <Stack.Screen name="izin/[id]" options={{ title: 'Detail Izin' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
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
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppProvider>
              <AppNavigator />
            </AppProvider>
          </NotificationProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
