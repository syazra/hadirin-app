import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from '@react-native-firebase/firestore';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PresensiBerhasilSheet } from '@/components/praktikan/presensi-berhasil-sheet';
import {
  hitungJarakMeterLokal,
  PresensiLocationStatus,
  type TargetLabPresensi,
} from '@/components/praktikan/presensi-location-status';
import { LayarPersiapan } from '@/components/shared/layar-persiapan';
import { AppButton } from '@/components/ui/app-button';
import { Colors, Spacing } from '@/constants/theme';
import { useUserLocation } from '@/hooks/use-user-location';
import { getFirebaseServices, isFirebaseAvailable } from '@/lib/firebase';
import { catatPresensiDariQr } from '@/services/presensi-service';
import type { Hasil, Presensi } from '@/types';
import { formatWaktu } from '@/utils/format-waktu';
import { bacaPayloadQr } from '@/utils/qr-payload';

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

function buatPesanHasil(hasil: Hasil<Presensi>): HasilTampilan {
  if (hasil.ok) {
    return {
      berhasil: true,
      judul: 'Presensi berhasil',
      pesan: 'Kehadiranmu berhasil dicatat.',
      waktuPresensi: hasil.data.waktuHadir
        ? formatWaktu(hasil.data.waktuHadir.toISOString())
        : undefined,
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
    case 'SUDAH_HADIR':
      return {
        berhasil: false,
        judul: 'Sudah presensi',
        pesan: 'Kehadiranmu sudah tercatat sebelumnya.',
      };
    case 'ADA_IZIN':
    case 'SUDAH_ADA_IZIN':
      return {
        berhasil: false,
        judul: 'Ada pengajuan izin',
        pesan: 'Kamu memiliki pengajuan izin untuk sesi ini.',
      };
    case 'BUKAN_ANGGOTA':
      return {
        berhasil: false,
        judul: 'Bukan anggota kelas',
        pesan: 'Akunmu tidak terdaftar sebagai anggota aktif kelas ini.',
      };
    case 'DATA_DIARSIPKAN':
      return {
        berhasil: false,
        judul: 'Sesi tidak tersedia',
        pesan: 'Kelas atau sesi sudah diarsipkan.',
      };
    case 'DATA_TIDAK_DITEMUKAN':
      return {
        berhasil: false,
        judul: 'Sesi tidak ditemukan',
        pesan: 'Data sesi tidak ditemukan atau tidak dapat diakses.',
      };
    case 'JARINGAN':
    case 'TIMEOUT':
      return {
        berhasil: false,
        judul: 'Koneksi bermasalah',
        pesan: 'Periksa koneksi internet, lalu coba kembali.',
      };
    case 'TIDAK_BERWENANG':
      return {
        berhasil: false,
        judul: 'Akses ditolak',
        pesan: 'Kamu tidak memiliki izin untuk melakukan presensi.',
      };
    case 'AUTENTIKASI_GAGAL':
      return {
        berhasil: false,
        judul: 'Sesi login berakhir',
        pesan: 'Silakan login kembali.',
      };
    case 'INPUT_TIDAK_VALID':
      return {
        berhasil: false,
        judul: 'Lokasi belum memenuhi syarat',
        pesan:
          hasil.pesan ||
          'Pastikan GPS aktif, akurat, dan berada di dalam area laboratorium.',
      };
    default:
      return {
        berhasil: false,
        judul: 'QR tidak valid',
        pesan: hasil.pesan || 'QR tidak sesuai dengan sesi praktikum ini.',
      };
  }
}

export function ScannerQr({ idSesi, onBerhasil, onBatal }: ScannerQrProps) {
  const [hasilTampilan, setHasilTampilan] = useState<HasilTampilan | null>(
    null,
  );
  const [sheetTerbuka, setSheetTerbuka] = useState(false);
  const [sedangMemproses, setSedangMemproses] = useState(false);
  const [sudahDipindai, setSudahDipindai] = useState(false);
  const [targetLab, setTargetLab] = useState<TargetLabPresensi | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const lokasi = useUserLocation({ watch: true });

  useEffect(() => {
    if (!isFirebaseAvailable || !idSesi) return;
    let aktif = true;

    (async () => {
      try {
        const { db } = getFirebaseServices();
        const sesiSnap = await getDoc(doc(db, 'sesi', idSesi));
        if (!aktif || !sesiSnap.exists()) return;

        const sesiData = sesiSnap.data();
        const labId =
          typeof sesiData?.labId === 'string' ? sesiData.labId.trim() : '';
        const namaLokasi =
          typeof sesiData?.lokasi === 'string' ? sesiData.lokasi.trim() : '';

        let labData: Record<string, unknown> | undefined;

        if (labId) {
          const labSnap = await getDoc(doc(db, 'laboratorium', labId));
          if (labSnap.exists()) {
            labData = labSnap.data();
          }
        } else if (namaLokasi) {
          const labQuery = query(
            collection(db, 'laboratorium'),
            where('namaLab', '==', namaLokasi),
            limit(1),
          );
          const labSnap = await getDocs(labQuery);
          if (!labSnap.empty) {
            labData = labSnap.docs[0].data();
          }
        }

        if (
          aktif &&
          labData &&
          typeof labData.latitude === 'number' &&
          typeof labData.longitude === 'number'
        ) {
          setTargetLab({
            namaLab:
              typeof labData.namaLab === 'string'
                ? labData.namaLab
                : namaLokasi || 'Laboratorium',
            latitude: labData.latitude,
            longitude: labData.longitude,
            radiusPresensi:
              typeof labData.radiusPresensi === 'number'
                ? labData.radiusPresensi
                : 50,
          });
        }
      } catch {
        // Jika gagal memuat koordinat lab di klien, validasi tetap dijalankan di server
      }
    })();

    return () => {
      aktif = false;
    };
  }, [idSesi]);

  const jarakLokalMeter =
    lokasi.position && targetLab
      ? Math.round(
          hitungJarakMeterLokal(
            lokasi.position.latitude,
            lokasi.position.longitude,
            targetLab.latitude,
            targetLab.longitude,
          ),
        )
      : null;

  const diLuarRadiusLokal =
    targetLab !== null &&
    jarakLokalMeter !== null &&
    jarakLokalMeter > targetLab.radiusPresensi;

  const lokasiSiapScan =
    !lokasi.loading &&
    !lokasi.servicesDisabled &&
    !lokasi.permissionDenied &&
    !lokasi.error &&
    lokasi.position !== null &&
    !lokasi.isLowAccuracy &&
    !diLuarRadiusLokal;

  async function prosesScan(payloadQr: string) {
    if (sedangMemproses || sudahDipindai) return;

    if (!lokasiSiapScan || !lokasi.position) {
      setSudahDipindai(true);
      setHasilTampilan({
        berhasil: false,
        judul: diLuarRadiusLokal
          ? 'Di luar radius laboratorium'
          : 'Lokasi belum siap',
        pesan: diLuarRadiusLokal
          ? `Jarakmu sekitar ${jarakLokalMeter} m dari ${targetLab?.namaLab ?? 'laboratorium'} (batas ${targetLab?.radiusPresensi} m).`
          : lokasi.error ??
            'Pastikan GPS aktif, akurasi stabil, dan izin lokasi diberikan sebelum memindai QR.',
      });
      setSheetTerbuka(true);
      return;
    }

    const qr = bacaPayloadQr(payloadQr);
    if (!qr || qr.idSesi !== idSesi) {
      setSudahDipindai(true);
      setHasilTampilan({
        berhasil: false,
        judul: 'QR tidak sesuai',
        pesan: 'QR bukan untuk sesi praktikum ini.',
      });
      setSheetTerbuka(true);
      return;
    }

    setSudahDipindai(true);
    setSedangMemproses(true);

    try {
      const hasil = await catatPresensiDariQr(payloadQr, lokasi.position);
      setHasilTampilan(buatPesanHasil(hasil));
    } catch {
      setHasilTampilan({
        berhasil: false,
        judul: 'Presensi gagal',
        pesan: 'Terjadi kendala saat memproses presensi.',
      });
    } finally {
      setSedangMemproses(false);
      setSheetTerbuka(true);
    }
  }

  function tutupHasil() {
    const berhasil = hasilTampilan?.berhasil ?? false;
    setSheetTerbuka(false);
    setHasilTampilan(null);
    if (berhasil) {
      onBerhasil();
    } else {
      setSudahDipindai(false);
    }
  }

  if (!permission) {
    return (
      <LayarPersiapan
        judul="Memeriksa kamera"
        pesan="Mohon tunggu sebentar."
      />
    );
  }

  if (!permission.granted) {
    return (
      <LayarPersiapan
        judul="Izin kamera diperlukan"
        pesan="Izinkan akses kamera untuk memindai QR presensi."
      >
        <AppButton
          title="Izinkan kamera"
          fullWidth
          onPress={requestPermission}
        />
        <AppButton
          title="Kembali"
          variant="outline"
          fullWidth
          onPress={onBatal}
        />
      </LayarPersiapan>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan QR Presensi</Text>
        <Text style={styles.subtitle}>
          Arahkan kamera ke QR yang ditampilkan oleh asisten.
        </Text>
      </View>

      <PresensiLocationStatus
        loading={lokasi.loading}
        permissionDenied={lokasi.permissionDenied}
        servicesDisabled={lokasi.servicesDisabled}
        position={lokasi.position}
        isLowAccuracy={lokasi.isLowAccuracy}
        error={lokasi.error}
        targetLab={targetLab}
        onRefresh={() => {
          void lokasi.refresh();
        }}
      />

      <View style={styles.qrCard}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={
            sudahDipindai || !lokasiSiapScan
              ? undefined
              : ({ data }) => {
                  void prosesScan(data);
                }
          }
        />
        {sedangMemproses ? (
          <Text style={styles.qrInfo}>Memverifikasi lokasi & presensi...</Text>
        ) : !lokasiSiapScan ? (
          <Text style={styles.qrInfo}>
            Pemindaian QR ditahan hingga lokasi GPS memenuhi syarat.
          </Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <AppButton
          title="Kembali"
          variant="outline"
          fullWidth
          disabled={sedangMemproses}
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
  title: { fontSize: 24, fontWeight: '700', color: Colors.light.text },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.light.textSecondary,
  },
  qrCard: {
    minHeight: 250,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  camera: {
    width: '100%',
    height: 300,
  },
  qrInfo: { fontSize: 14, color: Colors.light.textSecondary, textAlign: 'center' },
  actions: { gap: Spacing.two },
});