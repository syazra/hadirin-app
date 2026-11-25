import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { IconAlertCircle } from '@/components/ui/icons';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';

type ErrorStateProps = {
  judul?: string;
  /** Pesan penyebab error yang mudah dipahami pengguna. */
  pesan?: string;
  /** Jika diisi, menampilkan tombol untuk memuat ulang. */
  onCobaLagi?: () => void;
  labelTombol?: string;
  /** true saat proses coba lagi sedang berjalan. */
  sedangMencoba?: boolean;
  /** true: mengisi seluruh layar (default). false: ringkas, untuk di dalam kartu atau daftar. */
  layarPenuh?: boolean;
};

export function ErrorState({
  judul = 'Gagal memuat data',
  pesan = 'Terjadi gangguan koneksi atau layanan. Silakan coba lagi.',
  onCobaLagi,
  labelTombol = 'Coba lagi',
  sedangMencoba = false,
  layarPenuh = true,
}: ErrorStateProps) {
  return (
    <View
      style={[styles.wadah, layarPenuh ? styles.layarPenuh : styles.ringkas]}
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View style={styles.outerRing}>
        <View style={styles.innerCircle}>
          <IconAlertCircle size={24} color={Colors.light.danger} />
        </View>
      </View>

      <Text style={styles.judul}>{judul}</Text>
      <Text style={styles.pesan}>{pesan}</Text>

      {onCobaLagi ? (
        <Pressable
          onPress={onCobaLagi}
          disabled={sedangMencoba}
          accessibilityRole="button"
          accessibilityLabel={sedangMencoba ? 'Sedang mencoba lagi' : labelTombol}
          accessibilityState={{ disabled: sedangMencoba, busy: sedangMencoba }}
          style={({ pressed }) => [
            styles.tombol,
            sedangMencoba && styles.tombolNonaktif,
            pressed && !sedangMencoba && styles.ditekan,
          ]}
        >
          {sedangMencoba ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.tombolTeks}>{labelTombol}</Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wadah: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
  },
  layarPenuh: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  ringkas: {
    paddingVertical: 24,
  },
  outerRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  innerCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.light.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  judul: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    color: Colors.light.text,
    textAlign: 'center',
  },
  pesan: {
    fontFamily: Fonts.sans,
    fontSize: 13.5,
    lineHeight: 19,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 6,
    maxWidth: 280,
  },
  tombol: {
    minHeight: 44,
    minWidth: 136,
    paddingHorizontal: 20,
    borderRadius: Radii.md,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.primaryGlow,
  },
  tombolNonaktif: {
    opacity: 0.6,
  },
  ditekan: {
    opacity: 0.85,
  },
  tombolTeks: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
