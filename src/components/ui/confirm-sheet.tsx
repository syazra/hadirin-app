import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';

type ConfirmSheetProps = {
  visible: boolean;
  judul: string;
  pesan: string;
  onKonfirmasi: () => void;
  onBatal: () => void;
  labelKonfirmasi?: string;
  labelBatal?: string;
  loading?: boolean;
  disabled?: boolean;
  labelLoading?: string;
  destructive?: boolean;
};

export function ConfirmSheet({
  visible,
  judul,
  pesan,
  onKonfirmasi,
  onBatal,
  labelKonfirmasi = 'Ya, lanjutkan',
  labelBatal = 'Batal',
  loading = false,
  disabled = false,
  labelLoading = 'Memproses...',
  destructive = false,
}: ConfirmSheetProps) {
  const konfirmasiNonaktif = loading || disabled;

  return (
    <BottomSheet
      visible={visible}
      onTutup={onBatal}
      nonaktifTutup={loading}
      accessibilityLabelTutup="Tutup konfirmasi"
    >
      <View style={styles.konten}>
        <Text style={styles.title}>{judul}</Text>
        <Text style={styles.message}>{pesan}</Text>

        <Pressable
          onPress={onKonfirmasi}
          disabled={konfirmasiNonaktif}
          accessibilityRole="button"
          accessibilityLabel={loading ? labelLoading : labelKonfirmasi}
          accessibilityState={{ disabled: konfirmasiNonaktif, busy: loading }}
          style={({ pressed }) => [
            styles.confirmButton,
            destructive && styles.confirmButtonDanger,
            !konfirmasiNonaktif && !destructive && Shadows.primaryGlow,
            pressed && !konfirmasiNonaktif && styles.pressed,
            konfirmasiNonaktif && styles.disabled,
          ]}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.confirmText}>{labelLoading}</Text>
            </View>
          ) : (
            <Text style={styles.confirmText}>{labelKonfirmasi}</Text>
          )}
        </Pressable>

        <Pressable
          onPress={onBatal}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel={labelBatal}
          accessibilityState={{ disabled: loading }}
          style={({ pressed }) => [
            styles.cancelButton,
            pressed && !loading && styles.pressed,
            loading && styles.disabled,
          ]}
        >
          <Text style={styles.cancelText}>{labelBatal}</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  konten: {
    gap: 12,
  },
  title: {
    fontFamily: Fonts.sansBold,
    fontSize: 20,
    lineHeight: 26,
    color: Colors.light.text,
  },
  message: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.light.textSecondary,
    marginBottom: 6,
  },
  confirmButton: {
    minHeight: 50,
    borderRadius: Radii.md,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  confirmButtonDanger: {
    backgroundColor: Colors.light.danger,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confirmText: {
    fontFamily: Fonts.sansSemiBold,
    color: '#FFFFFF',
    fontSize: 15,
  },
  cancelButton: {
    minHeight: 48,
    borderRadius: Radii.md,
    backgroundColor: Colors.light.backgroundElement,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  cancelText: {
    fontFamily: Fonts.sansSemiBold,
    color: Colors.light.text,
    fontSize: 15,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.6,
  },
});
