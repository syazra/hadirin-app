import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { QrSesiPanel } from '@/components/asisten/qr-sesi-panel';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { Colors } from '@/constants/theme';
import { useApp } from '@/hooks/use-app';
import type { Sesi } from '@/types';

export interface PanelAksiAsistenProps {
  sesi: Sesi;
}

type AksiKonfirmasi = 'buka' | 'tutup' | null;

export function PanelAksiAsisten({ sesi }: PanelAksiAsistenProps) {
  const { bukaSesi, tutupSesi } = useApp();
  const [aksiKonfirmasi, setAksiKonfirmasi] =
    useState<AksiKonfirmasi>(null);

  const konfirmasiAksi = () => {
    const aksi = aksiKonfirmasi;

    setAksiKonfirmasi(null);

    if (aksi === 'buka') {
      bukaSesi(sesi.idSesi);
    } else if (aksi === 'tutup') {
      tutupSesi(sesi.idSesi);
    }
  };

  return (
    <View style={styles.container}>
      {sesi.statusSesi === 'BELUM_DIBUKA' && (
        <Pressable
          style={[styles.button, styles.bukaButton]}
          onPress={() => setAksiKonfirmasi('buka')}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Buka Sesi</Text>
        </Pressable>
      )}

      {sesi.statusSesi === 'DIBUKA' && (
        <Pressable
          style={[styles.button, styles.tutupButton]}
          onPress={() => setAksiKonfirmasi('tutup')}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Tutup Sesi</Text>
        </Pressable>
      )}

      <QrSesiPanel sesi={sesi} />

      <ConfirmSheet
        visible={aksiKonfirmasi !== null}
        judul={
          aksiKonfirmasi === 'buka'
            ? 'Buka Sesi?'
            : 'Tutup Sesi?'
        }
        pesan={
          aksiKonfirmasi === 'buka'
            ? 'Dengan membuka sesi, QR presensi akan tersedia agar praktikan dapat melakukan presensi.'
            : 'Sesi akan ditutup. Praktikan tidak dapat melakukan presensi lagi.'
        }
        labelKonfirmasi={
          aksiKonfirmasi === 'buka'
            ? 'Ya, Buka Sesi Sekarang'
            : 'Ya, Tutup Sesi'
        }
        labelBatal="Batal"
        onKonfirmasi={konfirmasiAksi}
        onBatal={() => setAksiKonfirmasi(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  bukaButton: {
    backgroundColor: Colors.light.primary,
  },
  tutupButton: {
    backgroundColor: Colors.light.danger,
  },
  buttonText: {
    color: Colors.light.backgroundElement,
    fontSize: 16,
    fontWeight: '600',
  },
});
