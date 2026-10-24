import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppCard } from '@/components/ui/app-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { InfoSheet } from '@/components/ui/info-sheet';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Hadir.in</Text>
        <Text style={styles.subtitle}>
          Preview komponen UI — Sprint 1
        </Text>

        <Text style={styles.sectionTitle}>Coba Halaman Jadwal</Text>

        <Pressable
          style={styles.navButton}
          onPress={() => router.push('/(asisten)/jadwal-asisten')}
        >
          <Text style={styles.navButtonText}>
            Buka Jadwal Asisten
          </Text>
        </Pressable>

        <Pressable
          style={styles.navButton}
          onPress={() => router.push('/jadwal-praktikan')}
        >
          <Text style={styles.navButtonText}>Buka Jadwal Praktikan</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>1. AppCard</Text>
        <AppCard>
          <Text style={styles.cardTitle}>Praktikum Basis Data</Text>
          <Text style={styles.description}>
            Senin, 08.00–10.00 WIB
          </Text>
        </AppCard>

        <Text style={styles.sectionTitle}>2. StatusBadge</Text>
        <View style={styles.badges}>
          <StatusBadge status="BELUM_DIBUKA" />
          <StatusBadge status="DIBUKA" />
          <StatusBadge status="DITUTUP" />
        </View>

        <Text style={styles.sectionTitle}>3. EmptyState</Text>
        <AppCard>
          <EmptyState
            judul="Belum ada jadwal"
            pesan="Jadwal praktikum kamu akan muncul di sini."
          />
        </AppCard>

        <Text style={styles.sectionTitle}>4. ConfirmSheet</Text>
        <AppCard>
          <Text style={styles.description}>
            Coba buka dialog konfirmasi di bawah.
          </Text>
          <Text
            style={styles.action}
            onPress={() => setConfirmVisible(true)}
          >
            Buka ConfirmSheet
          </Text>
        </AppCard>

        <Text style={styles.sectionTitle}>5. InfoSheet</Text>
        <AppCard>
          <Text style={styles.description}>
            Coba buka panel informasi.
          </Text>
          <Text
            style={styles.action}
            onPress={() => setInfoVisible(true)}
          >
            Buka InfoSheet
          </Text>
        </AppCard>
      </ScrollView>

      <ConfirmSheet
        visible={confirmVisible}
        judul="Konfirmasi tindakan"
        pesan="Apakah kamu yakin ingin melanjutkan?"
        onKonfirmasi={() => setConfirmVisible(false)}
        onBatal={() => setConfirmVisible(false)}
      />

      <InfoSheet
        visible={infoVisible}
        judul="Informasi Hadir.in"
        pesan="Ini adalah preview komponen informasi untuk aplikasi Hadir.in."
        onTutup={() => setInfoVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  action: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '700',
    paddingVertical: 8,
  },
  navButton: {
    backgroundColor: '#4F46E5',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
