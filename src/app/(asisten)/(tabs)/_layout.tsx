import { Tabs } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconHome, IconUser } from '@/components/ui/icons';
import { AnimatedTabPill } from '@/components/ui/motion';
import { Colors, Fonts } from '@/constants/theme';

export default function AsistenTabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.light.background,
        },
        headerShadowVisible: false,
        headerTitleAlign: 'center',
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: Colors.light.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.light.card,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: Colors.light.border,
          height: 66 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          shadowColor: '#2B2340',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontFamily: Fonts.sansSemiBold,
          fontSize: 11.5,
          lineHeight: 15,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="beranda-asisten"
        options={{
          title: 'Beranda',
          headerTitle: () => <Text style={styles.headerTitleCenter}>Beranda</Text>,
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabPill focused={focused}>
              <IconHome
                size={20}
                color={color}
                strokeWidth={focused ? 2.1 : 1.8}
              />
            </AnimatedTabPill>
          ),
        }}
      />

      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          headerTitle: () => <Text style={styles.headerTitleCenter}>Profil</Text>,
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabPill focused={focused}>
              <IconUser
                size={20}
                color={color}
                strokeWidth={focused ? 2.1 : 1.8}
              />
            </AnimatedTabPill>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerTitleCenter: {
    fontFamily: Fonts.sansBold,
    color: Colors.light.text,
    fontSize: 18,
    letterSpacing: -0.3,
  },
});
