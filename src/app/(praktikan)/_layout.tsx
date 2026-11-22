import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

export default function PraktikanLayout() {
  const { pengguna, loading, profilBelumLengkap } = useAuth();

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color={Colors.light.primary} /></View>;
  }

  if (!pengguna || profilBelumLengkap || pengguna.peran !== 'PRAKTIKAN') {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: Colors.light.card },
        headerTitleAlign: 'center',
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: Colors.light.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.light.card,
          borderTopColor: Colors.light.border,
        },
        tabBarLabelStyle: {
          fontFamily: Fonts.sansMedium,
          fontSize: 12,
          lineHeight: 16,
        },
      }}
    >
      <Tabs.Screen
        name="jadwal-praktikan"
        options={{
          title: 'Beranda',
          headerTitle: () => (
            <Text style={styles.headerTitleCenter}>Beranda</Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
              <Path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8" />
            </Svg>
          ),
        }}
      />

      <Tabs.Screen
        name="riwayat"
        options={{
          title: 'Riwayat',
          headerTitle: () => (
            <Text style={styles.headerTitleCenter}>Riwayat Saya</Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
              <Path d="M4 5v5h5M4 10a8 8 0 1 1 .5 7M12 7v5l3 2" />
            </Svg>
          ),
        }}
      />

      <Tabs.Screen
        name="izin-praktikan"
        options={{
          title: 'Izin',
          headerTitle: () => (
            <Text style={styles.headerTitleCenter}>Perizinan Saya</Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
              <Path d="M8 3h8a2 2 0 0 1 2 2v16H6V5a2 2 0 0 1 2-2Zm2 5h4m-4 4h4m-4 4h4" />
            </Svg>
          ),
        }}
      />

      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          headerTitle: () => (
            <Text style={styles.headerTitleCenter}>Profil</Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
              <Path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0" />
            </Svg>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  headerTitleCenter: {
    fontFamily: Fonts.sansBold,
    color: Colors.light.text,
    fontSize: 20,
  },
});