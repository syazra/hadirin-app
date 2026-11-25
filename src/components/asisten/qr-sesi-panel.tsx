import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import {
  IconAlertCircle,
  IconArrowLeft,
  IconLock,
  IconQrCode,
} from '@/components/ui/icons';
import { EnterView, PressableScale } from '@/components/ui/motion';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';
import { ambilKodeQr } from '@/services/sesi-service';
import type { Sesi } from '@/types';
import { buatPayloadQr } from '@/utils/qr-payload';

export interface QrSesiPanelProps {
  sesi: Sesi;
  kelasDiarsipkan?: boolean;
}

interface StateQr {
  sesiId: string;
  retryKey: number;
  kodeQr: string | null;
  loading: boolean;
  error: string | null;
}

export function QrSesiPanel({
  sesi,
  kelasDiarsipkan = false,
}: QrSesiPanelProps) {
  const [qrDiperbesar, setQrDiperbesar] = useState(false);
  const [stateQr, setStateQr] = useState<StateQr | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const dataDiarsipkan = sesi.diarsipkan || kelasDiarsipkan;
  const sesiAktifDibuka = sesi.statusSesi === 'DIBUKA' && !dataDiarsipkan;

  const muatUlang = useCallback(() => {
    setRetryKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!sesiAktifDibuka) {
      return;
    }

    const sesiIdAktif = sesi.idSesi;
    const retryAktif = retryKey;
    let aktif = true;

    ambilKodeQr(sesiIdAktif).then((hasil) => {
      if (!aktif) {
        return;
      }

      if (hasil.ok) {
        setStateQr({
          sesiId: sesiIdAktif,
          retryKey: retryAktif,
          kodeQr: hasil.data,
          loading: false,
          error: null,
        });
      } else {
        setStateQr({
          sesiId: sesiIdAktif,
          retryKey: retryAktif,
          kodeQr: null,
          loading: false,
          error: hasil.pesan,
        });
      }
    });

    return () => {
      aktif = false;
    };
  }, [sesi.idSesi, sesiAktifDibuka, retryKey]);

  const qrAktif =
    sesiAktifDibuka &&
    stateQr?.sesiId === sesi.idSesi &&
    stateQr.retryKey === retryKey
      ? stateQr
      : null;
  const loading = sesiAktifDibuka ? (qrAktif?.loading ?? true) : false;
  const kodeQr = qrAktif?.kodeQr ?? null;
  const error = qrAktif?.error ?? null;

  if (dataDiarsipkan) {
    return (
      <AppCard style={styles.card}>
        <View style={styles.medallionNeutral}>
          <IconLock size={22} color={Colors.light.textSecondary} />
        </View>
        <Text style={styles.title}>QR Tidak Tersedia</Text>
        <Text style={styles.message}>
          {kelasDiarsipkan
            ? 'Kelas sudah diarsipkan.'
            : 'Sesi sudah diarsipkan.'}
        </Text>
      </AppCard>
    );
  }

  if (sesi.statusSesi === 'BELUM_DIBUKA') {
    return (
      <AppCard style={styles.card}>
        <View style={styles.medallionWarm}>
          <IconLock size={22} color={Colors.light.warm} />
        </View>
        <Text style={styles.title}>QR Presensi Terkunci</Text>
        <Text style={styles.message}>
          Buka sesi untuk menampilkan kode QR presensi.
        </Text>
      </AppCard>
    );
  }

  if (sesi.statusSesi === 'DITUTUP') {
    return (
      <AppCard style={styles.card}>
        <View style={styles.medallionNeutral}>
          <IconLock size={22} color={Colors.light.textSecondary} />
        </View>
        <Text style={styles.title}>Sesi Ditutup</Text>
        <Text style={styles.message}>
          QR presensi sudah dinonaktifkan.
        </Text>
      </AppCard>
    );
  }

  if (loading) {
    return (
      <AppCard style={styles.card}>
        <View style={styles.medallionPrimary}>
          <ActivityIndicator size="small" color={Colors.light.primary} />
        </View>
        <Text style={styles.title}>Menyiapkan QR Presensi…</Text>
      </AppCard>
    );
  }

  if (error || !kodeQr) {
    return (
      <AppCard style={styles.card}>
        <View style={styles.medallionDanger}>
          <IconAlertCircle size={22} color={Colors.light.danger} />
        </View>
        <Text style={styles.title}>Gagal Memuat QR</Text>
        <Text style={styles.message}>
          {error ?? 'Kode QR sesi tidak tersedia.'}
        </Text>
        <AppButton title="Coba Lagi" fullWidth onPress={muatUlang} />
      </AppCard>
    );
  }

  const payloadQr = buatPayloadQr(sesi.idSesi, kodeQr);

  return (
    <>
      <AppCard style={styles.card}>
        <View style={styles.qrHeader}>
          <View style={styles.medallionPrimarySmall}>
            <IconQrCode size={18} color={Colors.light.primary} />
          </View>
          <View style={styles.qrHeaderText}>
            <Text style={styles.qrTitle}>QR Presensi</Text>
            <Text style={styles.qrHint}>Tunjukkan ke praktikan untuk scan</Text>
          </View>
        </View>

        <EnterView scaleFrom={0.92} distance={10}>
          <View style={styles.qrContainer}>
            <QRCode
              value={payloadQr}
              size={196}
              backgroundColor={Colors.light.card}
              color={Colors.light.text}
            />
          </View>
        </EnterView>

        <AppButton
          title="Perbesar QR"
          variant="outline"
          fullWidth
          onPress={() => setQrDiperbesar(true)}
        />
      </AppCard>

      <Modal
        visible={qrDiperbesar && sesiAktifDibuka}
        animationType="slide"
        onRequestClose={() => setQrDiperbesar(false)}
      >
        <View style={styles.modalScreen}>
          <PressableScale
            style={styles.closeButton}
            scaleTo={0.92}
            onPress={() => setQrDiperbesar(false)}
            accessibilityRole="button"
            accessibilityLabel="Kembali"
          >
            <IconArrowLeft size={20} color={Colors.light.text} />
          </PressableScale>

          <View style={styles.modalCenter}>
            <Text style={styles.modalTitle}>QR Sesi Praktikum</Text>
            <Text style={styles.message}>
              Arahkan kamera praktikan ke kode di bawah ini.
            </Text>

            <EnterView scaleFrom={0.92} distance={10}>
              <View style={styles.largeQrContainer}>
                <QRCode
                  value={payloadQr}
                  size={260}
                  backgroundColor={Colors.light.card}
                  color={Colors.light.text}
                />
              </View>
            </EnterView>
          </View>

          <AppButton
            title="Tutup"
            fullWidth
            size="large"
            onPress={() => setQrDiperbesar(false)}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    padding: 20,
    gap: 14,
  },
  medallionWarm: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.warmSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medallionNeutral: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.backgroundElement,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medallionPrimary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medallionDanger: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrHeader: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  medallionPrimarySmall: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.light.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrHeaderText: {
    flex: 1,
    gap: 2,
  },
  qrTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    color: Colors.light.text,
  },
  qrHint: {
    fontFamily: Fonts.sans,
    fontSize: 12.5,
    color: Colors.light.textSecondary,
  },
  title: {
    fontFamily: Fonts.sansBold,
    fontSize: 17,
    color: Colors.light.text,
    textAlign: 'center',
  },
  message: {
    fontFamily: Fonts.sans,
    fontSize: 13.5,
    lineHeight: 19,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    backgroundColor: Colors.light.card,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.subtle,
  },
  modalScreen: {
    flex: 1,
    padding: 24,
    paddingTop: 52,
    justifyContent: 'space-between',
    backgroundColor: Colors.light.background,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  modalCenter: {
    alignItems: 'center',
    gap: 14,
  },
  modalTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 22,
    color: Colors.light.text,
    textAlign: 'center',
  },
  largeQrContainer: {
    marginTop: 8,
    padding: 24,
    borderRadius: Radii.xl,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.elevated,
  },
});
