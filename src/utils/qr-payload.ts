import type { Sesi } from '@/types';

// TODO(Farhan): implementasikan format hadirin:<idSesi>:<kodeQr> pada Tahap 1a.
export function buatPayloadQr(_sesi: Sesi): string {
  throw new Error('buatPayloadQr belum tersedia. Lengkapi pada Tahap 1a.');
}

export function bacaPayloadQr(_teks: string): { idSesi: string; kodeQr: string } | null {
  // Fail closed: stub tidak pernah menerima QR sebagai payload valid.
  return null;
}
