import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { QrSesiPanel } from '@/components/asisten/qr-sesi-panel';
import { AppButton } from '@/components/ui/app-button';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { IconAlertCircle } from '@/components/ui/icons';
import { Colors, Fonts, Radii } from '@/constants/theme';
import { bukaSesi, tutupSesi } from '@/services/sesi-service';
import type { Sesi } from '@/types';

export interface PanelAksiAsistenProps {
  sesi: Sesi;
  kelasDiarsipkan?: boolean;
}

type AksiKonfirmasi = 'buka' | 'tutup' | null;

export function PanelAksiAsisten({
  sesi,
  kelasDiarsipkan = false,
}: PanelAksiAsistenProps) {
  const [aksiKonfirmasi, setAksiKonfirmasi] = useState<AksiKonfirmasi>(null);
  const [sedangProses, setSedangProses] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);

  const bolehBuka =
    sesi.statusSesi === 'BELUM_DIBUKA' &&
    !sesi.diarsipkan &&
    !kelasDiarsipkan;
  const bolehTutup = sesi.statusSesi === 'DIBUKA' && !sesi.diarsipkan;

  const konfirmasiAksi = async () => {
    if (sedangProses || !aksiKonfirmasi) {
      return;
    }

    const aksi = aksiKonfirmasi;
    setSedangProses(true);
    setPesanError(null);

    const hasil =
      aksi === 'buka'
        ? await bukaSesi(sesi.idSesi)
        : await tutupSesi(sesi.idSesi);

    setSedangProses(false);
    setAksiKonfirmasi(null);

    if (!hasil.ok) {
      setPesanError(hasil.pesan);
    }
  };

  return (
    <View style={styles.container}>
      {bolehBuka && (
        <AppButton
          title="Buka Sesi Presensi"
          variant="primary"
          size="large"
          fullWidth
          loading={sedangProses}
          onPress={() => {
            setPesanError(null);
            setAksiKonfirmasi('buka');
          }}
        />
      )}

      {bolehTutup && (
        <AppButton
          title="Tutup Sesi"
          variant="danger"
          size="large"
          fullWidth
          loading={sedangProses}
          onPress={() => {
            setPesanError(null);
            setAksiKonfirmasi('tutup');
          }}
        />
      )}

      {pesanError ? (
        <View style={styles.errorBox}>
          <IconAlertCircle size={17} color={Colors.light.danger} />
          <Text style={styles.errorText}>{pesanError}</Text>
        </View>
      ) : null}

      <QrSesiPanel sesi={sesi} kelasDiarsipkan={kelasDiarsipkan} />

      <ConfirmSheet
        visible={aksiKonfirmasi !== null}
        judul={aksiKonfirmasi === 'buka' ? 'Buka Sesi?' : 'Tutup Sesi?'}
        pesan={
          aksiKonfirmasi === 'buka'
            ? 'QR presensi akan aktif agar praktikan dapat melakukan presensi.'
            : 'Sesi akan ditutup. Praktikan tidak dapat melakukan presensi lagi.'
        }
        labelKonfirmasi={
          sedangProses
            ? 'Memproses...'
            : aksiKonfirmasi === 'buka'
              ? 'Ya, Buka Sesi'
              : 'Ya, Tutup Sesi'
        }
        labelBatal="Batal"
        destructive={aksiKonfirmasi === 'tutup'}
        onKonfirmasi={konfirmasiAksi}
        onBatal={() => {
          if (!sedangProses) {
            setAksiKonfirmasi(null);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: Radii.md,
    backgroundColor: Colors.light.dangerSoft,
    borderWidth: 1,
    borderColor: '#FAD0DC',
  },
  errorText: {
    flex: 1,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.danger,
  },
});
