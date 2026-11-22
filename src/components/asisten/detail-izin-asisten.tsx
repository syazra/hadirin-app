import { useState } from 'react';
import { Alert, ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { KategoriAiBadge } from '@/components/praktikan/kategori-ai-badge';
import { Colors } from '@/constants/theme';
import { klasifikasikanIzin } from '@/services/izin-ai-service';
import { putuskanIzin } from '@/services/izin-service';
import type { Izin } from '@/types';

type Props = { izin: Izin };

export function DetailIzinAsisten({ izin }: Props) {
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingKeputusan, setLoadingKeputusan] = useState(false);

  async function jalankanKlasifikasi() {
    if (loadingAi || izin.statusIzin !== 'MENUNGGU') return;

    setLoadingAi(true);
    try {
      const hasil = await klasifikasikanIzin(izin.idIzin);
      if (!hasil.ok) {
        Alert.alert('Klasifikasi gagal', hasil.pesan);
      } else {
        Alert.alert('Berhasil', `Kategori AI: ${hasil.data.kategori}`);
      }
    } catch {
      Alert.alert('Klasifikasi gagal', 'Terjadi kesalahan saat menghubungi layanan AI.');
    } finally {
      setLoadingAi(false);
    }
  }

  function konfirmasi(status: 'DISETUJUI' | 'DITOLAK') {
    if (izin.statusIzin !== 'MENUNGGU' || loadingKeputusan) return;

    const label = status === 'DISETUJUI' ? 'menyetujui' : 'menolak';

    Alert.alert(
      'Konfirmasi keputusan',
      `Yakin ingin ${label} pengajuan izin ini? Keputusan tidak dapat diubah.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: status === 'DISETUJUI' ? 'Setujui' : 'Tolak',
          style: status === 'DITOLAK' ? 'destructive' : 'default',
          onPress: async () => {
            setLoadingKeputusan(true);
            const hasil = await putuskanIzin(izin.idIzin, status);
            setLoadingKeputusan(false);

            if (!hasil.ok) {
              Alert.alert('Keputusan gagal', hasil.pesan);
            } else {
              Alert.alert('Berhasil', `Pengajuan berhasil ${status === 'DISETUJUI' ? 'disetujui' : 'ditolak'}.`);
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Pemeriksaan Asisten</Text>
      <Text style={styles.label}>ID Praktikan</Text>
      <Text style={styles.value}>{izin.uid}</Text>
      <Text style={styles.label}>Alasan izin</Text>
      <Text style={styles.value}>{izin.alasan}</Text>

      <Text style={styles.label}>Hasil klasifikasi AI</Text>
      <KategoriAiBadge kategori={izin.kategoriAi} statusAi={izin.statusAi} versiKategoriAi={izin.versiKategoriAi} />
      <Text style={styles.note}>IZIN khusus lomba sebagai delegasi UNDIP/Departemen. Alasan di luar sakit dan delegasi lomba termasuk ALPHA.</Text>
      {izin.kategoriAi === 'ALPHA' && (
        <Text style={styles.note}>ALPHA dari AI tidak otomatis menolak pengajuan. Jika Asisten menyetujui, rekap tetap IZIN.</Text>
      )}

      {izin.statusIzin === 'MENUNGGU' && (
        <>
          <Pressable style={styles.aiButton} onPress={jalankanKlasifikasi} disabled={loadingAi}>
            {loadingAi ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>{izin.statusAi === 'GAGAL' ? 'Coba Klasifikasi Lagi' : 'Klasifikasikan dengan AI'}</Text>}
          </Pressable>

          <Text style={styles.note}>Hasil AI hanya rekomendasi. Asisten tetap menentukan keputusan secara manual.</Text>

          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.approve]} onPress={() => konfirmasi('DISETUJUI')} disabled={loadingKeputusan}>
              <Text style={styles.buttonText}>Setujui</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.reject]} onPress={() => konfirmasi('DITOLAK')} disabled={loadingKeputusan}>
              <Text style={styles.buttonText}>Tolak</Text>
            </Pressable>
          </View>
          {loadingKeputusan && <ActivityIndicator color={Colors.light.primary} />}
        </>
      )}

      {izin.statusIzin !== 'MENUNGGU' && (
        <Text style={styles.note}>Pengajuan ini sudah diputuskan. Keputusan bersifat final.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 14, borderWidth: 1, borderColor: Colors.light.border, backgroundColor: Colors.light.card, gap: 10 },
  title: { fontSize: 16, fontWeight: '700', color: Colors.light.text },
  label: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 4 },
  value: { fontSize: 13, color: Colors.light.text, lineHeight: 20 },
  aiButton: { backgroundColor: Colors.light.primary, borderRadius: 10, padding: 12, alignItems: 'center' },
  actions: { flexDirection: 'row', gap: 10 },
  button: { flex: 1, padding: 13, borderRadius: 10, alignItems: 'center' },
  approve: { backgroundColor: '#21865B' },
  reject: { backgroundColor: '#C74747' },
  buttonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  note: { fontSize: 11, color: Colors.light.textSecondary, lineHeight: 17 },
});
