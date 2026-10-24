import { Link } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';

type LayarPersiapanProps = PropsWithChildren<{
  judul: string;
  pesan: string;
}>;

// Shell sementara milik Farhan; komponen fitur tetap dikerjakan pemiliknya.
export function LayarPersiapan({ judul, pesan, children }: LayarPersiapanProps) {
  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{judul}</Text>
        <Text style={styles.message}>{pesan}</Text>
        {children}
        <Link href="/" style={styles.link}>Kembali ke beranda</Link>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: Spacing.four, gap: Spacing.three },
  title: { color: Colors.light.text, fontSize: 24, fontWeight: '700' },
  message: { color: Colors.light.textSecondary, fontSize: 16, lineHeight: 24 },
  link: { color: Colors.light.primary, minHeight: 48, paddingVertical: 12, fontSize: 16 },
});
