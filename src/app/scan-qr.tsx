import { Redirect, router, useLocalSearchParams } from 'expo-router';

import { ScannerQr } from '@/components/praktikan/scanner-qr';
import { LayarPersiapan } from '@/components/shared/layar-persiapan';
import { AppButton } from '@/components/ui/app-button';
import { LoadingState } from '@/components/ui/loading-state';
import { useAuth } from '@/hooks/use-auth';
import { useSesiDetail } from '@/hooks/use-sesi-detail';

export default function ScanQrScreen() {
  const { idSesi } = useLocalSearchParams<{ idSesi?: string | string[] }>();
  const { pengguna, loading: authLoading } = useAuth();

  const idSesiNorm = Array.isArray(idSesi) ? idSesi[0] : idSesi;
  const {
    sesi,
    kelas,
    loading: sesiLoading,
    error,
    muatUlang,
  } = useSesiDetail(idSesiNorm ?? null);

  if (authLoading || sesiLoading) {
    return <LoadingState pesan="Memuat data sesi..." />;
  }

  if (!pengguna) {
    return <Redirect href="/" />;
  }

  if (error) {
    return (
      <LayarPersiapan judul="Gagal memuat sesi" pesan={error}>
        <AppButton title="Coba Lagi" fullWidth onPress={muatUlang} />
        <AppButton
          title="Kembali"
          variant="outline"
          fullWidth
          onPress={() => router.back()}
        />
      </LayarPersiapan>
    );
  }

  if (!sesi) {
    return (
      <LayarPersiapan
        judul="Sesi tidak ditemukan"
        pesan="Buka pemindaian QR dari detail sesi yang tersedia."
      >
        <AppButton
          title="Kembali"
          variant="outline"
          fullWidth
          onPress={() => router.back()}
        />
      </LayarPersiapan>
    );
  }

  if (sesi.diarsipkan || kelas?.diarsipkan) {
    return (
      <LayarPersiapan
        judul="Sesi tidak tersedia"
        pesan="Kelas atau sesi ini sudah diarsipkan sehingga presensi dinonaktifkan."
      >
        <AppButton
          title="Kembali"
          variant="outline"
          fullWidth
          onPress={() => router.back()}
        />
      </LayarPersiapan>
    );
  }

  if (sesi.statusSesi !== 'DIBUKA') {
    return (
      <LayarPersiapan
        judul={
          sesi.statusSesi === 'BELUM_DIBUKA'
            ? 'Sesi belum dibuka'
            : 'Sesi sudah ditutup'
        }
        pesan={
          sesi.statusSesi === 'BELUM_DIBUKA'
            ? 'Tunggu sampai asisten membuka sesi sebelum memindai QR.'
            : 'Presensi sudah ditutup dan tidak dapat dilakukan lagi.'
        }
      >
        <AppButton
          title="Kembali"
          variant="outline"
          fullWidth
          onPress={() => router.back()}
        />
      </LayarPersiapan>
    );
  }

  return (
    <ScannerQr
      idSesi={sesi.idSesi}
      onBerhasil={() => router.back()}
      onBatal={() => router.back()}
    />
  );
}