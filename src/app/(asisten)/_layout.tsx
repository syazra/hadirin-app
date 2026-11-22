import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Colors, Fonts, Spacing } from '@/constants/theme';
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
        name="maps"
        options={{
          title: 'Peta',
          tabBarIcon: ({ color, size }) => (
            <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
              <Path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Zm6-3v15m6-12v15" />
            </Svg>
          ),
        }}
      />

      <Tabs.Screen
        name="laboratorium"
        options={{
          title: 'Laboratorium',
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />

      <Tabs.Screen
        name="kelas"
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
        name="jadwal-asisten"
        options={{
          title: 'Jadwal',
          headerTitle: () => (
            <Text style={styles.headerTitleCenter}>Jadwal Praktikum</Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
              <Path d="M7 3v4m10-4v4M4 10h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Zm2 9h3m4 0h3m-10 3h3" />
            </Svg>
          ),
        }}
      />

      <Tabs.Screen
        name="rekap"
        options={{
          title: 'Rekap',
          headerTitle: () => (
            <Text style={styles.headerTitleCenter}>Rekap Kehadiran</Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
              <Path d="M9 5H5v16h14V5h-4M9 3h6v4H9V3Zm-2 9h10M7 16h10" />
            </Svg>
          ),
        }}
      />

      <Tabs.Screen
        name="izin-asisten"
        options={{
          title: 'Izin',
          headerTitle: () => (
            <Text style={styles.headerTitleCenter}>Perizinan</Text>
          ),
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  headerTitleCenter: {
    fontFamily: Fonts.sansBold,
    color: Colors.light.text,
    fontSize: 20,
  },
});