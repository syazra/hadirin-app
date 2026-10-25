import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { PresensiBerhasilSheet } from '@/components/praktikan/presensi-berhasil-sheet';
import { Colors, Spacing } from '@/constants/theme';
import { useApp } from '@/hooks/use-app';
import type { HasilPresensi } from '@/types';
import { LayarPersiapan } from '@/components/shared/layar-persiapan';
import { buatPayloadQr } from '@/utils/qr-payload';

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
      waktuPresensi: new Date().toISOString(),
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
  const [hasilTampilan, setHasilTampilan] = useState<HasilTampilan | null>(null);
  const [sheetTerbuka, setSheetTerbuka] = useState(false);
  const [sedangMemproses, setSedangMemproses] = useState(false);

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
        pesan="Halaman ini hanya dapat digunakan oleh praktikan."
      />
    );
  }

  function prosesSimulasi() {
    if (sedangMemproses || !sesi || !penggunaAktif) return;

    setSedangMemproses(true);

    try {
      // Kamera ditunda, masih berupa Simulasi Scan (PRS-9).
      const payloadQr = buatPayloadQr(sesi);
      const hasil = catatPresensiDariQr(payloadQr, penggunaAktif.idPengguna);

      setHasilTampilan(buatPesanHasil(hasil));
    } catch {
      setHasilTampilan({
        berhasil: false,
        judul: 'Presensi belum tersedia',
        pesan: 'Fungsi pencatatan presensi belum diimplementasikan.',
      });
    }

    setSheetTerbuka(true);
    setSedangMemproses(false);
  }

  function tutupHasil() {
    const berhasil = hasilTampilan?.berhasil ?? false;

    setSheetTerbuka(false);
    setHasilTampilan(null);

    if (berhasil) onBerhasil();
  }

  if (sesi.statusSesi !== 'DIBUKA') {
    return (
      <LayarPersiapan
        judul="Presensi belum tersedia"
        pesan={sesi.statusSesi === 'BELUM_DIBUKA'
          ? 'Sesi belum dibuka oleh asisten.'
          : 'Sesi praktikum sudah ditutup.'}
      >
        <AppButton title="Kembali" variant="outline" fullWidth onPress={onBatal} />
      </LayarPersiapan>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Simulasi Scan QR</Text>
        <Text style={styles.subtitle}>
          Tekan tombol di bawah untuk menyimulasikan pemindaian QR
          sesi praktikum.
        </Text>
      </View>

      <View style={styles.qrCard}>
        <Text style={styles.qrIcon}>▦</Text>
        <Text style={styles.qrTitle}>QR Praktikum</Text>
        <Text style={styles.qrInfo}>{sesi.namaPraktikum}</Text>
        <Text style={styles.qrInfo}>{sesi.kelasLab}</Text>
        <Text style={styles.simulasiLabel}>Mode simulasi</Text>
      </View>

      <View style={styles.actions}>
        <AppButton
          title={sedangMemproses ? 'Memproses...' : 'Simulasi Scan'}
          onPress={prosesSimulasi}
          loading={sedangMemproses}
          disabled={sedangMemproses}
          fullWidth
        />
        <AppButton title="Kembali" variant="outline" fullWidth onPress={onBatal} />
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
  qrIcon: { fontSize: 90, color: Colors.light.primary },
  qrTitle: { fontSize: 20, fontWeight: '700', color: Colors.light.text },
  qrInfo: { fontSize: 14, color: Colors.light.textSecondary },
  simulasiLabel: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.light.primarySoft,
    color: Colors.light.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  actions: { gap: Spacing.two },
});
