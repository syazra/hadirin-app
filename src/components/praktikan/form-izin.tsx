import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { TextField } from '@/components/ui/text-field';
import { Colors, Spacing } from '@/constants/theme';
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
      <View style={styles.info}>
        <Text style={styles.label}>Sesi praktikum</Text>
        <Text style={styles.session}>{namaSesi}</Text>
      </View>

      <Text style={styles.description}>
        Tuliskan alasan kamu tidak dapat mengikuti sesi praktikum ini.
        Pengajuan akan diperiksa oleh asisten.
      </Text>

      <TextField
        label="Alasan izin"
        value={alasan}
        onChangeText={(value) => {
          setAlasan(value);
          if (error) setError(null);
        }}
        placeholder="Contoh: Saya sedang sakit dan perlu beristirahat..."
        error={error ?? undefined}
        multiline
        maxLength={BATAS_ALASAN_IZIN}
        editable={!loading}
      />

      <Text style={styles.note}>
        Hasil klasifikasi AI hanya menjadi informasi pendukung.
        Keputusan tetap dibuat oleh asisten.
      </Text>

      <AppButton
        title="Kirim Pengajuan"
        onPress={kirimPengajuan}
        loading={loading}
        disabled={loading}
        fullWidth
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  info: {
    padding: Spacing.three,
    borderRadius: 14,
    backgroundColor: Colors.light.primarySoft,
    gap: 5,
  },
  label: {
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
  session: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '700',
  },
  description: {
    color: Colors.light.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  note: {
    color: Colors.light.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});