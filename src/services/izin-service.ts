import type {
    Hasil,
    Izin,
    StatusIzin,
} from '@/types';

/**
 * Stub Tahap 0.
 * Operasi pengajuan dan keputusan izin belum diimplementasikan.
 */
function belumDiimplementasikan(): Hasil {
    return {
        ok: false,
        alasan: 'TIDAK_DIKENAL',
        pesan: 'Service izin belum diimplementasikan.',
    };
}

/**
 * Mengajukan izin untuk suatu sesi.
 * Implementasi sebenarnya menjadi tanggung jawab Binar.
 */
export async function ajukanIzin(
    sesiId: string,
    alasan: string,
): Promise<Hasil<Izin>> {
    void sesiId;
    void alasan;

    return {
        ok: false,
        alasan: 'TIDAK_DIKENAL',
        pesan: 'Pengajuan izin belum diimplementasikan.',
    };
}

/**
 * Memberikan keputusan terhadap pengajuan izin.
 */
export async function putuskanIzin(
    idIzin: string,
    status: Extract<StatusIzin, 'DISETUJUI' | 'DITOLAK'>,
): Promise<Hasil> {
    void idIzin;
    void status;

    return belumDiimplementasikan();
}

/**
 * Mendengarkan daftar izin milik pengguna.
 */
export function listenIzinPengguna(
    uid: string,
    callback: (izin: Izin[]) => void,
    onError: (error: Error) => void,
): () => void {
    void onError;

    let aktif = true;

    const dataContoh: Izin[] = [
        {
            idIzin: 'stub-izin-1',
            sesiId: 'stub-sesi-1',
            kelasId: 'stub-kelas-1',
            uid,
            alasan: 'Contoh alasan izin (data stub)',
            statusIzin: 'MENUNGGU',
            diperiksaOleh: null,
            waktuPeriksa: null,
            kategoriAi: null,
            statusAi: 'BELUM',
            modelAi: null,
            waktuAi: null,
            dibuatPada: null,
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
 * Mendengarkan daftar izin berdasarkan sesi.
 */
export function listenIzinSesi(
    sesiId: string,
    callback: (izin: Izin[]) => void,
    onError: (error: Error) => void,
): () => void {
    void onError;

    let aktif = true;

    const dataContoh: Izin[] = [
        {
            idIzin: `stub-izin-${sesiId}`,
            sesiId,
            kelasId: 'stub-kelas-1',
            uid: 'stub-praktikan-1',
            alasan: 'Contoh alasan izin (data stub)',
            statusIzin: 'MENUNGGU',
            diperiksaOleh: null,
            waktuPeriksa: null,
            kategoriAi: null,
            statusAi: 'BELUM',
            modelAi: null,
            waktuAi: null,
            dibuatPada: null,
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
 * Mendengarkan daftar izin berdasarkan kelas.
 */
export function listenIzinKelas(
    kelasId: string,
    callback: (izin: Izin[]) => void,
    onError: (error: Error) => void,
): () => void {
    void onError;

    let aktif = true;

    const dataContoh: Izin[] = [
        {
            idIzin: 'stub-izin-1',
            sesiId: 'stub-sesi-1',
            kelasId,
            uid: 'stub-praktikan-1',
            alasan: 'Contoh alasan izin (data stub)',
            statusIzin: 'MENUNGGU',
            diperiksaOleh: null,
            waktuPeriksa: null,
            kategoriAi: null,
            statusAi: 'BELUM',
            modelAi: null,
            waktuAi: null,
            dibuatPada: null,
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