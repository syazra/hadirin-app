import type {
    Hasil,
    Presensi,
} from '@/types';

/**
 * Stub Tahap 0.
 * Pencatatan presensi belum diimplementasikan.
 */
export async function catatPresensiDariQr(
    payloadQr: string,
): Promise<Hasil<Presensi>> {
    void payloadQr;

    return {
        ok: false,
        alasan: 'TIDAK_DIKENAL',
        pesan: 'Service presensi belum diimplementasikan.',
    };
}

/**
 * Mendengarkan daftar presensi berdasarkan sesi.
 */
export function listenPresensiSesi(
    sesiId: string,
    callback: (presensi: Presensi[]) => void,
    onError: (error: Error) => void,
): () => void {
    void onError;

    let aktif = true;

    const dataContoh: Presensi[] = [
        {
            idPresensi: `stub-presensi-${sesiId}`,
            sesiId,
            kelasId: 'stub-kelas-1',
            uid: 'stub-praktikan-1',
            waktuHadir: null,
        },
    ];

    Promise.resolve().then(() => {
        if (aktif) {
            callback(dataContoh);
        }
    });

    return () => {
        aktif = false;
    };
}

/**
 * Mendengarkan riwayat presensi berdasarkan pengguna.
 */
export function listenPresensiPengguna(
    uid: string,
    callback: (presensi: Presensi[]) => void,
    onError: (error: Error) => void,
): () => void {
    void onError;

    let aktif = true;

    const dataContoh: Presensi[] = [
        {
            idPresensi: 'stub-presensi-1',
            sesiId: 'stub-sesi-1',
            kelasId: 'stub-kelas-1',
            uid,
            waktuHadir: null,
        },
    ];

    Promise.resolve().then(() => {
        if (aktif) {
            callback(dataContoh);
        }
    });

    return () => {
        aktif = false;
    };
}