import { useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StyleSheet, Text, View } from 'react-native';

import { LayarPersiapan } from '@/components/shared/layar-persiapan';
import { PresensiBerhasilSheet } from '@/components/praktikan/presensi-berhasil-sheet';
import { AppButton } from '@/components/ui/app-button';
import { Colors, Spacing } from '@/constants/theme';
import { useApp } from '@/hooks/use-app';
import type { HasilPresensi } from '@/types';

export interface ScannerQrProps {
  idSesi: string;
  onBerhasil: () => void;
  onBatal: () => void;
}

type HasilTampilan = {
  berhasil: boolean;
  judul: string;
  pesan: string;
  waktuPresensi?: string;
};

function buatPesanHasil(hasil: HasilPresensi): HasilTampilan {
  if (hasil.ok) {
    return {
      berhasil: true,
      judul: 'Presensi berhasil',
      pesan: 'Kehadiranmu berhasil dicatat.',
      waktuPresensi: new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  }

  switch (hasil.alasan) {
    case 'BELUM_DIBUKA':
      return {
        berhasil: false,
        judul: 'Sesi belum dibuka',
        pesan: 'Tunggu sampai asisten membuka sesi.',
      };
    case 'SUDAH_DITUTUP':
      return {
        berhasil: false,
        judul: 'Sesi sudah ditutup',
        pesan: 'Presensi tidak dapat dilakukan lagi.',
      };
    case 'SUDAH_PRESENSI':
      return {
        berhasil: false,
        judul: 'Sudah presensi',
        pesan: 'Kehadiranmu sudah tercatat sebelumnya.',
      };
    default:
      return {
        berhasil: false,
        judul: 'QR tidak valid',
        pesan: 'QR tidak sesuai dengan sesi praktikum ini.',
      };
  }
}

export function ScannerQr({ idSesi, onBerhasil, onBatal }: ScannerQrProps) {
  const [izinKamera, mintaIzinKamera] = useCameraPermissions();
  const [hasilTampilan, setHasilTampilan] = useState<HasilTampilan | null>(null);
  const [sheetTerbuka, setSheetTerbuka] = useState(false);
  const [sedangMemproses, setSedangMemproses] = useState(false);
  const [sudahMemindai, setSudahMemindai] = useState(false);

  const { penggunaAktif, getSesiById, catatPresensiDariQr } = useApp();
  const sesi = getSesiById(idSesi);

  if (!sesi) {
    return (
      <LayarPersiapan
        judul="Sesi tidak ditemukan"
        pesan="Pilih sesi praktikum yang tersedia."
      />
    );
  }

  if (!penggunaAktif || penggunaAktif.peran !== 'PRAKTIKAN') {
    return (
      <LayarPersiapan
        judul="Akses tidak tersedia"
        pesan="Halaman scan QR hanya dapat digunakan oleh praktikan."
      />
    );
  }

  function prosesPayloadQr(payloadQr: string) {
    if (sedangMemproses) return;

    setSedangMemproses(true);
    setSudahMemindai(true);

    try {
      const idPengguna = penggunaAktif?.idPengguna;
      if (!idPengguna) return;
      const hasil = catatPresensiDariQr(payloadQr, idPengguna);
      setHasilTampilan(buatPesanHasil(hasil));
    } catch {
      setHasilTampilan({
        berhasil: false,
        judul: 'Presensi belum tersedia',
        pesan: 'Fungsi pencatatan presensi belum siap. ' +
          'Pastikan fondasi state aplikasi sudah diperbarui.',
      });
    }
    setSheetTerbuka(true);
    setSedangMemproses(false);
  }

  function simulasiScan() {
    if (!sesi) return;
    prosesPayloadQr(`hadirin:${sesi.idSesi}:${sesi.kodeQr}`);
  }

  function tutupHasil() {
    const berhasil = hasilTampilan?.berhasil ?? false;

    setSheetTerbuka(false);
    setHasilTampilan(null);
    setSudahMemindai(false);

    if (berhasil) onBerhasil();
  }

  if (sesi.statusSesi !== 'DIBUKA') {
    const pesan = sesi.statusSesi === 'BELUM_DIBUKA'
      ? 'Sesi belum dibuka oleh asisten. Kamu dapat melakukan presensi setelah sesi dibuka.'
      : 'Sesi praktikum sudah ditutup. Presensi tidak dapat dilakukan lagi.';

    return (
      <LayarPersiapan judul="Presensi belum tersedia" pesan={pesan}>
        <AppButton
          title="Kembali"
          variant="outline"
          fullWidth
          onPress={onBatal}
        />
      </LayarPersiapan>
    );
  }

  if (!izinKamera) {
    return (
      <LayarPersiapan
        judul="Menyiapkan kamera"
        pesan="Memeriksa izin kamera perangkat."
      />
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan QR Presensi</Text>
        <Text style={styles.subtitle}>
          Arahkan kamera ke QR sesi praktikum yang ditampilkan oleh asisten.
        </Text>
      </View>

      {izinKamera.granted ? (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={sudahMemindai ? undefined : ({ data }) => prosesPayloadQr(data)}
          />
          <View pointerEvents="none" style={styles.scanOverlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.scanHint}>Posisikan QR di dalam kotak</Text>
          </View>
        </View>
      ) : (
        <View style={styles.permissionCard}>
          <Text style={styles.permissionTitle}>Kamera belum tersedia</Text>
          <Text style={styles.permissionMessage}>
            Izinkan akses kamera untuk memindai QR. Kamu tetap bisa memakai simulasi scan.
          </Text>
          <AppButton
            title="Izinkan Kamera"
            variant="outline"
            fullWidth
            onPress={mintaIzinKamera}
          />
        </View>
      )}

      <View style={styles.actions}>
        <AppButton
          title={sedangMemproses ? 'Memproses...' : 'Simulasi Scan'}
          onPress={simulasiScan}
          loading={sedangMemproses}
          disabled={sedangMemproses}
          fullWidth
        />

        {sudahMemindai && !sheetTerbuka && (
          <AppButton
            title="Pindai Lagi"
            variant="outline"
            fullWidth
            onPress={() => setSudahMemindai(false)}
          />
        )}

        <AppButton
          title="Kembali"
          variant="outline"
          fullWidth
          onPress={onBatal}
        />
      </View>

      {hasilTampilan && (
        <PresensiBerhasilSheet
          visible={sheetTerbuka}
          berhasil={hasilTampilan.berhasil}
          judul={hasilTampilan.judul}
          pesan={hasilTampilan.pesan}
          waktuPresensi={hasilTampilan.waktuPresensi}
          onClose={tutupHasil}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  header: { gap: Spacing.two },
  title: { color: Colors.light.text, fontSize: 24, fontWeight: '700' },
  subtitle: {
    color: Colors.light.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  cameraContainer: {
    height: 340,
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: '#111827',
  },
  camera: { flex: 1 },
  scanOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  scanFrame: {
    width: 220,
    height: 220,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 24,
  },
  scanHint: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  permissionCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  permissionTitle: { color: Colors.light.text, fontSize: 17, fontWeight: '700' },
  permissionMessage: {
    color: Colors.light.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  actions: { gap: Spacing.two },
});
