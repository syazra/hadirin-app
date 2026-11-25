import { Link } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconInfo } from '@/components/ui/icons';
import { Colors, Fonts, Radii, Shadows, Spacing } from '@/constants/theme';

type LayarPersiapanProps = PropsWithChildren<{
  judul: string;
  pesan: string;
}>;

export function LayarPersiapan({ judul, pesan, children }: LayarPersiapanProps) {
  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <IconInfo size={24} color={Colors.light.primary} />
          </View>
          <Text style={styles.title}>{judul}</Text>
          <Text style={styles.message}>{pesan}</Text>
          {children}
          <Link href="/" style={styles.link}>
            Kembali ke beranda
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 24,
    alignItems: 'center',
    gap: Spacing.three,
    ...Shadows.card,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.light.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Fonts.sansBold,
    color: Colors.light.text,
    fontSize: 20,
    textAlign: 'center',
  },
  message: {
    fontFamily: Fonts.sans,
    color: Colors.light.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  link: {
    fontFamily: Fonts.sansSemiBold,
    color: Colors.light.primary,
    paddingVertical: 10,
    fontSize: 14.5,
  },
});
