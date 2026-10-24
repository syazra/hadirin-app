import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Sesi } from '@/types';
import { useApp } from '@/hooks/use-app';

export interface PanelAksiAsistenProps {
  sesi: Sesi;
}

export function PanelAksiAsisten({ sesi }: PanelAksiAsistenProps) {
  const { bukaSesi, tutupSesi } = useApp();

  const konfirmasiBukaSesi = () => {
    Alert.alert(
      'Buka Sesi?',
      'Apakah kamu yakin ingin membuka sesi praktikum ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Buka Sesi',
          onPress: () => bukaSesi(sesi.idSesi),
        },
      ],
    );
  };

  const konfirmasiTutupSesi = () => {
    Alert.alert(
      'Tutup Sesi?',
      'Praktikan tidak dapat melakukan presensi setelah sesi ditutup.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Tutup Sesi',
          style: 'destructive',
          onPress: () => tutupSesi(sesi.idSesi),
        },
      ],
    );
  };

  if (sesi.statusSesi === 'BELUM_DIBUKA') {
    return (
      <View style={styles.container}>
        <Pressable
          style={[styles.button, styles.bukaButton]}
          onPress={konfirmasiBukaSesi}
        >
          <Text style={styles.buttonText}>Buka Sesi</Text>
        </Pressable>
      </View>
    );
  }

  if (sesi.statusSesi === 'DIBUKA') {
    return (
      <View style={styles.container}>
        <Pressable
          style={[styles.button, styles.tutupButton]}
          onPress={konfirmasiTutupSesi}
        >
          <Text style={styles.buttonText}>Tutup Sesi</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.infoText}>Sesi sudah ditutup.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  button: {
    alignItems: 'center',
    borderRadius: 10,
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
