import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';

import { FormIzin } from '@/components/praktikan/form-izin';
import { Colors } from '@/constants/theme';
import { ajukanIzin } from '@/services/izin-service';

export default function AjukanIzinScreen() {
  const router = useRouter();
  const { sesiId } = useLocalSearchParams<{ sesiId: string }>();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(alasan: string) {
    if (!sesiId || loading) return;

    setLoading(true);
    const hasil = await ajukanIzin(sesiId, alasan);
    setLoading(false);

    if (!hasil.ok) {
      Alert.alert('Pengajuan gagal', hasil.pesan);
      return;
    }

    Alert.alert(
      'Pengajuan berhasil',
      'Pengajuan izin sudah tersimpan dan menunggu pemeriksaan asisten.',
      [{ text: 'OK', onPress: () => router.back() }],
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <FormIzin
        namaSesi={sesiId ?? 'Sesi praktikum'}
        loading={loading}
        onSubmit={handleSubmit}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
});
