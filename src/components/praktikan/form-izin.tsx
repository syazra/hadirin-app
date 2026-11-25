import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { BrandGradient } from '@/components/ui/brand-gradient';
import { IconCalendar, IconSparkles } from '@/components/ui/icons';
import { TextField } from '@/components/ui/text-field';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';
import { BATAS_ALASAN_IZIN, validasiAlasanIzin } from '@/utils/validasi-izin';

type FormIzinProps = {
  namaSesi: string;
  loading?: boolean;
  onSubmit: (alasan: string) => void;
};

export function FormIzin({
  namaSesi,
  loading = false,
  onSubmit,
}: FormIzinProps) {
  const [alasan, setAlasan] = useState('');
  const [error, setError] = useState<string | null>(null);

  function kirimPengajuan() {
    const pesanError = validasiAlasanIzin(alasan);
    setError(pesanError);

    if (!pesanError) {
      onSubmit(alasan.trim());
    }
  }

  return (
    <View style={styles.container}>
      <BrandGradient variant="warm" decorative={false} style={styles.sessionChip}>
        <View style={styles.sessionIcon}>
          <IconCalendar size={17} color={Colors.light.warm} />
        </View>
        <View style={styles.sessionMeta}>
          <Text style={styles.label}>Sesi praktikum</Text>
          <Text style={styles.session} numberOfLines={1}>
            {namaSesi}
          </Text>
        </View>
      </BrandGradient>

      <View style={styles.formCard}>
        <TextField
          label="Alasan izin"
          value={alasan}
          onChangeText={(value) => {
            setAlasan(value);
            if (error) setError(null);
          }}
          placeholder="Contoh: Sakit dan perlu beristirahat..."
          error={error ?? undefined}
          multiline
          maxLength={BATAS_ALASAN_IZIN}
          showCounter
          editable={!loading}
        />

        <View style={styles.notePill}>
          <IconSparkles size={14} color={Colors.light.brandMid} />
          <Text style={styles.note}>
            AI memberi rekomendasi · keputusan akhir di asisten
          </Text>
        </View>

        <AppButton
          title="Kirim Pengajuan"
          onPress={kirimPengajuan}
          loading={loading}
          disabled={loading}
          fullWidth
          size="large"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  sessionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: '#F6DFD5',
  },
  sessionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.light.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  sessionMeta: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontFamily: Fonts.sansMedium,
    color: Colors.light.textSecondary,
    fontSize: 11.5,
  },
  session: {
    fontFamily: Fonts.sansBold,
    color: Colors.light.text,
    fontSize: 15,
  },
  formCard: {
    backgroundColor: Colors.light.card,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 18,
    gap: 14,
    ...Shadows.card,
  },
  notePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: Colors.light.brandMidSoft,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: Radii.md,
  },
  note: {
    flex: 1,
    fontFamily: Fonts.sansMedium,
    color: Colors.light.brandMid,
    fontSize: 11.5,
    lineHeight: 16,
  },
});
