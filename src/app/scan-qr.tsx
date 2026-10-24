import { router, useLocalSearchParams } from 'expo-router';

import { ScannerQr } from '@/components/praktikan/scanner-qr';
import { LayarPersiapan } from '@/components/shared/layar-persiapan';
import { useApp } from '@/hooks/use-app';

// Route tipis milik Binar. Kamera dan validasi dilengkapi di fitur scan.
export default function ScanQrScreen() {
  const { idSesi } = useLocalSearchParams<{ idSesi?: string | string[] }>();
  const { getSesiById } = useApp();

  if (typeof idSesi !== 'string' || !getSesiById(idSesi)) {
    return <LayarPersiapan judul="Sesi tidak ditemukan" pesan="Buka pemindaian QR dari detail sesi yang tersedia." />;
  }

  return <ScannerQr idSesi={idSesi} onBerhasil={() => router.back()} onBatal={() => router.back()} />;
}
