import type { Sesi } from '@/types/legacy';

export function buatPayloadQr(sesi: Sesi): string;
export function buatPayloadQr(sesiId: string, kodeQr: string): string;

export function buatPayloadQr(
    sesiOrId: Sesi | string,
    kodeQr?: string,
): string {
    const idSesi =
        typeof sesiOrId === 'string'
            ? sesiOrId
            : sesiOrId.idSesi;

    const kode =
        typeof sesiOrId === 'string'
            ? kodeQr
            : sesiOrId.kodeQr;

    if (!idSesi || !kode) {
        throw new Error('ID sesi dan kode QR wajib tersedia.');
    }

    return `hadirin:${idSesi}:${kode}`;
}

export function bacaPayloadQr(
    teks: string,
): { idSesi: string; kodeQr: string } | null {
    if (typeof teks !== 'string') return null;

    const bagian = teks.split(':');
    const [awalan, idSesi, kodeQr] = bagian;

    if (
        bagian.length !== 3 ||
        awalan !== 'hadirin' ||
        !idSesi ||
        !kodeQr ||
        /\s/.test(idSesi + kodeQr)
    ) {
        return null;
    }

    return { idSesi, kodeQr };
}
