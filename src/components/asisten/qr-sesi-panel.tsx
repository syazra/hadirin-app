
import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { AppCard } from '@/components/ui/app-card';
import type { Sesi } from '@/types';

export interface QrSesiPanelProps {
  sesi: Sesi;
}

export function QrSesiPanel({ sesi }: QrSesiPanelProps) {
  const [qrDiperbesar, setQrDiperbesar] = useState(false);

  // Format sementara mengikuti kontrak payload di PRD.
  // Implementasi bersama qr-payload.ts masih menunggu Farhan.
  const payloadQr = `hadirin:${sesi.idSesi}:${sesi.kodeQr}`;

  if (sesi.statusSesi === 'BELUM_DIBUKA') {
    return (
      <AppCard style={styles.card}>
        <Text style={styles.icon}>🔒</Text>
        <Text style={styles.title}>QR Presensi Belum Tersedia</Text>
        <Text style={styles.message}>
          Sesi belum dibuka. QR presensi akan muncul otomatis
          setelah sesi dibuka oleh Anda selaku Asisten.
        </Text>
      </AppCard>
    );
  }

  if (sesi.statusSesi === 'DITUTUP') {
    return (
      <AppCard style={styles.card}>
        <Text style={styles.icon}>🔒</Text>
        <Text style={styles.title}>Sesi Sudah Ditutup</Text>
        <Text style={styles.message}>
          QR presensi sudah tidak tersedia. Praktikan tidak dapat
          melakukan presensi lagi pada sesi ini.
        </Text>
      </AppCard>
    );
  }

  return (
    <>
      <AppCard style={styles.card}>
        <Text style={styles.icon}>▦</Text>
        <Text style={styles.title}>QR Kode Presensi</Text>
        <Text style={styles.message}>
          Minta praktikan memindai QR ini melalui aplikasi Hadir.in.
        </Text>

        <View style={styles.qrContainer}>
          <QRCode
            value={payloadQr}
            size={200}
            backgroundColor="#FFFFFF"
            color="#111827"
          />
        </View>

        <Pressable
          style={styles.button}
          onPress={() => setQrDiperbesar(true)}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Perbesar QR</Text>
        </Pressable>
      </AppCard>

      <Modal
        visible={qrDiperbesar}
        animationType="slide"
        onRequestClose={() => setQrDiperbesar(false)}
      >
        <View style={styles.modalScreen}>
          <Pressable
            style={styles.closeButton}
            onPress={() => setQrDiperbesar(false)}
            accessibilityRole="button"
          >
            <Text style={styles.closeText}>‹ Kembali</Text>
          </Pressable>

          <Text style={styles.modalTitle}>QR Sesi Praktikum</Text>
          <Text style={styles.message}>
            Arahkan kamera aplikasi Hadir.in Praktikan ke kode QR ini.
          </Text>

          <View style={styles.largeQrContainer}>
            <QRCode
              value={payloadQr}
              size={260}
              backgroundColor="#FFFFFF"
              color="#111827"
            />
          </View>

          <Pressable
            style={styles.button}
            onPress={() => setQrDiperbesar(false)}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Tutup Tampilan Penuh</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: 16,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    color: '#6B7280',
    textAlign: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  button: {
    minHeight: 48,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2563EB',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  modalScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 20,
    backgroundColor: '#F9FAFB',
  },
  closeButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563EB',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  largeQrContainer: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
});