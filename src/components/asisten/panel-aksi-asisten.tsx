import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { useApp } from '@/hooks/use-app';
import type { Sesi } from '@/types';
import { QrSesiPanel } from '@/components/asisten/qr-sesi-panel';

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

      {sesi.statusSesi === 'DITUTUP' && (
        <Text style={styles.infoText}>Sesi sudah ditutup.</Text>
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
    backgroundColor: '#2563EB',
  },
  tutupButton: {
    backgroundColor: '#DC2626',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    color: '#6B7280',
    fontSize: 14,
  },
});