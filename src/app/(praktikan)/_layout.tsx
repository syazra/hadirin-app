import { Tabs } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AppButton } from '@/components/ui/app-button';
import { Colors, Spacing } from '@/constants/theme';
import { useApp } from '@/hooks/use-app';

export default function PraktikanLayout() {
  const { penggunaAktif, gantiPeran } = useApp();

  return (
    <Tabs
      initialRouteName="jadwal-praktikan"
      screenOptions={{
        headerStyle: { backgroundColor: Colors.light.card },
        headerTitleAlign: 'left',
        headerTitle: () => (
          <Text numberOfLines={1} style={styles.name}>{penggunaAktif?.nama}</Text>
        ),
        headerRight: () => (
          <AppButton
            title="Ganti peran"
            variant="outline"
            size="small"
            style={styles.switchButton}
            accessibilityHint="Ganti peran atau identitas."
            onPress={gantiPeran}
          />
        ),
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: Colors.light.textSecondary,
        tabBarStyle: { backgroundColor: Colors.light.card, borderTopColor: Colors.light.border },
        tabBarLabelStyle: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
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
    </Tabs>
  );
}

const styles = StyleSheet.create({
  name: { color: Colors.light.text, fontSize: 15, fontWeight: '600' },
  switchButton: { minHeight: 44, marginRight: Spacing.three },
});
