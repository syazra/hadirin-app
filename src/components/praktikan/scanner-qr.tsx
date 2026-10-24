import { LayarPersiapan } from '@/components/shared/layar-persiapan';

export interface ScannerQrProps {
  idSesi: string;
  onBerhasil: () => void;
  onBatal: () => void;
}

// TODO(Binar): kamera, izin saat layar dibuka, dan Simulasi scan.
// Stub tidak memasang kamera dan tidak meminta izin.
export function ScannerQr(_props: ScannerQrProps) {
  return <LayarPersiapan judul="Scan QR" pesan="Pemindaian QR untuk sesi ini akan tersedia di sini." />;
}
