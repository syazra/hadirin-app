import type { Hasil, Kelas } from '@/types';

/**
 * Stub Tahap 0.
 * Operasi tulis belum diimplementasikan.
 */
function belumDiimplementasikan(): Hasil {
    return {
        ok: false,
        alasan: 'TIDAK_DIKENAL',
        pesan: 'Service kelas belum diimplementasikan.',
    };
}

/**
 * Menambahkan kelas.
 * Implementasi sebenarnya menjadi tanggung jawab Azka.
 */
export async function tambahKelas(
    namaPraktikum: string,
): Promise<Hasil> {
    void namaPraktikum;
    return belumDiimplementasikan();
}

/**
 * Mengubah data kelas.
 */
export async function ubahKelas(
    idKelas: string,
    data: Partial<Pick<Kelas, 'namaPraktikum' | 'diarsipkan'>>,
): Promise<Hasil> {
    void idKelas;
    void data;
    return belumDiimplementasikan();
}

/**
 * Mengarsipkan kelas.
 */
export async function arsipkanKelas(
    idKelas: string,
): Promise<Hasil> {
    void idKelas;
    return belumDiimplementasikan();
}

/**
 * Mendengarkan daftar kelas milik asisten.
 *
 * Stub mengirim satu contoh data secara asynchronous.
 * Fungsi cleanup tetap dikembalikan secara sinkron.
 */
export function listenKelasAsisten(
    uid: string,
    callback: (kelas: Kelas[]) => void,
    onError: (error: Error) => void,
): () => void {
    void onError;

    let aktif = true;

    const dataContoh: Kelas[] = [
        {
            idKelas: 'stub-kelas-1',
            namaPraktikum: 'Contoh Kelas (data stub)',
            asistenUid: uid,
            diarsipkan: false,
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