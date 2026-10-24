import type { Sesi } from '@/types';

export function buatPayloadQr(sesi: Sesi): string {
  return `hadirin:${sesi.idSesi}:${sesi.kodeQr}`;
}

export function bacaPayloadQr(teks: string): { idSesi: string; kodeQr: string } | null {
  if (typeof teks !== 'string') return null;

  const bagian = teks.split(':');
  const [awalan, idSesi, kodeQr] = bagian;
  if (bagian.length !== 3 || awalan !== 'hadirin' || !idSesi || !kodeQr || /\s/.test(idSesi + kodeQr)) {
    return null;
  }
  return { idSesi, kodeQr };
}
