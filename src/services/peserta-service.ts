import type {
    Hasil,
    Keanggotaan,
    StatusKeanggotaan,
} from '@/types';

/**
 * Stub Tahap 0.
 * Operasi tulis belum diimplementasikan.
 */
function belumDiimplementasikan(): Hasil {
    return {
        ok: false,
        alasan: 'TIDAK_DIKENAL',
        pesan: 'Service peserta belum diimplementasikan.',
    };
}

/**
 * Menambahkan peserta menggunakan kode peserta.
 * Implementasi sebenarnya menjadi tanggung jawab Azka.
 */
export async function tambahPesertaByKode(
    idKelas: string,
    kode: string,
): Promise<Hasil> {
    void idKelas;
    void kode;
    return belumDiimplementasikan();
}

/**
 * Mengubah status keanggotaan peserta.
 */
export async function ubahStatusPeserta(
    idKeanggotaan: string,
    status: StatusKeanggotaan,
): Promise<Hasil> {
    void idKeanggotaan;
    void status;
    return belumDiimplementasikan();
}

/**
 * Menonaktifkan peserta.
 */
export async function nonaktifkanPeserta(
    idKeanggotaan: string,
): Promise<Hasil> {
    void idKeanggotaan;
    return belumDiimplementasikan();
}

/**
 * Mendengarkan daftar peserta dalam suatu kelas.
 *
 * Stub memberikan data contoh secara asynchronous.
 * Fungsi cleanup dikembalikan secara sinkron.
 */
export function listenPesertaKelas(
    idKelas: string,
    callback: (peserta: Keanggotaan[]) => void,
    onError: (error: Error) => void,
): () => void {
    void onError;

    let aktif = true;

    const dataContoh: Keanggotaan[] = [
        {
            idKeanggotaan: 'stub-keanggotaan-1',
            kelasId: idKelas,
            uid: 'stub-peserta-1',
            nama: 'Contoh Peserta',
            nim: '000000000000',
            status: 'AKTIF',
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