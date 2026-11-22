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
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  type TextProps,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Colors, Fonts, Spacing } from '@/constants/theme';
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
  const insets = useSafeAreaInsets();
  const headerContentHeight = Platform.OS === 'ios' ? 44 : 64;

  return (
    <Stack
      screenOptions={{
        contentStyle: {
          backgroundColor: Colors.light.background,
        },
        header: ({ navigation, options, back }) => (
          <View
            style={[
              styles.headerContainer,
              {
                paddingTop: insets.top,
                height: headerContentHeight + insets.top,
              },
            ]}
          >
            {back ? (
              <Pressable
                onPress={navigation.goBack}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.backButtonPressed,
                ]}
              >
                <Svg
                  width={22}
                  height={22}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={Colors.light.primary}
                  strokeWidth={2}
                >
                  <Path d="M19 12H5m0 0 7 7m-7-7 7-7" />
                </Svg>
              </Pressable>
            ) : null}
            <Text style={styles.headerTitleLeft} numberOfLines={1}>
              {options.title ?? ''}
            </Text>
          </View>
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
        <Stack.Screen name="scan-qr" options={{ title: 'Scan QR' }} />
        <Stack.Screen name="izin/ajukan" options={{ title: 'Ajukan izin' }} />
      </Stack.Protected>

      {/* Detail sesi */}
      <Stack.Protected
        guard={!loading && !!pengguna && !profilBelumLengkap}
        redirectTo="/"
      >
        <Stack.Screen name="sesi/[id]" options={{ title: 'Sesi' }} />
        <Stack.Screen name="izin/[id]" options={{ title: 'Detail izin' }} />
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
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppProvider>
            <AppNavigator />
          </AppProvider>
        </NotificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    paddingHorizontal: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.two,
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  headerTitleLeft: {
    flex: 1,
    fontFamily: Fonts.sans,
    color: Colors.light.text,
    fontSize: 20,
    includeFontPadding: false,
  },
});
