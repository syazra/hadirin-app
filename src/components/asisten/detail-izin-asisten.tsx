import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { KategoriAiBadge } from '@/components/praktikan/kategori-ai-badge';
import {
  IconCheckCircle,
  IconSparkles,
  IconXCircle,
} from '@/components/ui/icons';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';
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
      Alert.alert(
        'Klasifikasi gagal',
        'Terjadi kesalahan saat menghubungi layanan AI.',
      );
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
              Alert.alert(
                'Berhasil',
                `Pengajuan berhasil ${status === 'DISETUJUI' ? 'disetujui' : 'ditolak'}.`,
              );
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.stack}>
      {/* Alasan Card */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Alasan Izin</Text>
          <View style={styles.uidPill}>
            <Text style={styles.uidText} numberOfLines={1}>
              {izin.uid}
            </Text>
          </View>
        </View>

        <View style={styles.reasonQuote}>
          <Text style={styles.reasonText}>{izin.alasan}</Text>
        </View>
      </View>

      {/* AI Recommendation Card */}
      <View style={styles.card}>
        <View style={styles.aiTitleRow}>
          <IconSparkles size={16} color={Colors.light.brandMid} />
          <Text style={styles.title}>Rekomendasi AI</Text>
        </View>

        <KategoriAiBadge
          kategori={izin.kategoriAi}
          statusAi={izin.statusAi}
          versiKategoriAi={izin.versiKategoriAi}
        />

        <Text style={styles.note}>
          Rekomendasi AI · keputusan akhir di asisten
        </Text>

        {izin.statusIzin === 'MENUNGGU' && (
          <Pressable
            style={({ pressed }) => [
              styles.aiButton,
              pressed && styles.pressed,
            ]}
            onPress={jalankanKlasifikasi}
            disabled={loadingAi}
          >
            {loadingAi ? (
              <ActivityIndicator size="small" color={Colors.light.brandMid} />
            ) : (
              <>
                <IconSparkles size={16} color={Colors.light.brandMid} />
                <Text style={styles.aiButtonText}>
                  {izin.statusAi === 'GAGAL'
                    ? 'Coba Klasifikasi Lagi'
                    : 'Klasifikasikan dengan AI'}
                </Text>
              </>
            )}
          </Pressable>
        )}
      </View>

      {/* Decision Action Buttons */}
      {izin.statusIzin === 'MENUNGGU' ? (
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.reject,
              pressed && styles.pressed,
            ]}
            onPress={() => konfirmasi('DITOLAK')}
            disabled={loadingKeputusan}
          >
            <IconXCircle size={18} color={Colors.light.danger} />
            <Text style={styles.rejectText}>Tolak</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.approve,
              pressed && styles.pressed,
            ]}
            onPress={() => konfirmasi('DISETUJUI')}
            disabled={loadingKeputusan}
          >
            <IconCheckCircle size={18} color="#FFFFFF" />
            <Text style={styles.approveText}>Setujui</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.finalNote}>
          Keputusan telah dicatat dan bersifat final.
        </Text>
      )}

      {loadingKeputusan && <ActivityIndicator color={Colors.light.primary} />}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 14,
  },
  card: {
    padding: 18,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    gap: 12,
    ...Shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    color: Colors.light.text,
  },
  uidPill: {
    backgroundColor: Colors.light.backgroundElement,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    maxWidth: 140,
  },
  uidText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  reasonQuote: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.primary,
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  reasonText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 21,
  },
  aiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  note: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 17,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 46,
    backgroundColor: Colors.light.brandMidSoft,
    borderWidth: 1,
    borderColor: '#DFD5FF',
    borderRadius: Radii.md,
    paddingHorizontal: 14,
  },
  aiButtonText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13.5,
    color: Colors.light.brandMid,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    minHeight: 52,
    borderRadius: Radii.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  reject: {
    backgroundColor: Colors.light.dangerSoft,
    borderWidth: 1,
    borderColor: '#FAD0DC',
  },
  rejectText: {
    fontFamily: Fonts.sansBold,
    fontSize: 14.5,
    color: Colors.light.danger,
  },
  approve: {
    backgroundColor: Colors.light.success,
    ...Shadows.emeraldGlow,
  },
  approveText: {
    fontFamily: Fonts.sansBold,
    fontSize: 14.5,
    color: '#FFFFFF',
  },
  finalNote: {
    fontFamily: Fonts.sans,
    fontSize: 12.5,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    paddingVertical: 4,
  },
  pressed: {
    opacity: 0.85,
  },
});
