import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Colors, Spacing } from '@/constants/theme';
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
        headerTitleAlign: 'left',
        headerTitle: () => (
          <Text numberOfLines={1} style={styles.name}>
            {pengguna?.nama ?? 'Hadir.in'}
          </Text>
        ),
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: Colors.light.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.light.card,
          borderTopColor: Colors.light.border,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          lineHeight: 16,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="jadwal-praktikan"
        options={{
          title: 'Jadwal',
          tabBarIcon: ({ color, size }) => (
            <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
              <Path d="M7 3v4m10-4v4M4 10h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Zm2 9h3m4 0h3m-10 3h3" />
            </Svg>
          ),
        }}
      />

      <Tabs.Screen
        name="riwayat"
        options={{
          title: 'Riwayat',
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
          tabBarIcon: ({ color, size }) => (
            <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
              <Path d="M7 3h10v18H7zM9 8h6m-6 4h6m-6 4h4" />
            </Svg>
          ),
        }}
      />

      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
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
  name: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '600',
  },
});
