import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />

      <Stack>
        <Stack.Screen
          name="index"
          options={{ title: 'Hadir.in', headerShown: false }}
        />
        <Stack.Screen
          name="explore"
          options={{ title: 'Explore' }}
        />
        <Stack.Screen
          name="(asisten)/jadwal-asisten"
          options={{ title: 'Jadwal Asisten' }}
        />
        <Stack.Screen
          name="(praktikan)/jadwal-praktikan"
          options={{ title: 'Jadwal Praktikan' }}
        />
        <Stack.Screen
          name="sesi/[id]"
          options={{ title: 'Detail Sesi' }}
        />
      </Stack>
    </ThemeProvider>
  );
}
