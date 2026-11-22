import { Redirect, Stack } from 'expo-router';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

export default function AsistenLayout() {
  const { pengguna, loading, profilBelumLengkap } = useAuth();
  const insets = useSafeAreaInsets();
  const headerContentHeight = Platform.OS === 'ios' ? 44 : 64;

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
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="kelas" options={{ title: 'Praktikum' }} />
      <Stack.Screen name="jadwal-asisten" options={{ title: 'Jadwal' }} />
      <Stack.Screen name="rekap" options={{ title: 'Rekap Kehadiran' }} />
      <Stack.Screen name="izin-asisten" options={{ title: 'Perizinan' }} />
      <Stack.Screen name="maps" options={{ title: 'Peta' }} />
      <Stack.Screen name="laboratorium" options={{ title: 'Laboratorium' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
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