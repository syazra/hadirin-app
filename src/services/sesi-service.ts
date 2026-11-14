import type {
    Hasil,
    Sesi,
} from '@/types';

/**
 * Input untuk membuat sesi baru.
 */
export type InputBuatSesi = {
    kelasId: string;
    judul: string;
    lokasi: string;
    waktuMulai: Date;
    waktuSelesai: Date | null;
};

/**
 * Data yang boleh diubah melalui edit sesi.
 */
export type InputUbahSesi = Partial<
    Pick<
        Sesi,
        'judul' | 'lokasi' | 'waktuMulai' | 'waktuSelesai'
    >
>;

/**
 * Stub Tahap 0.
 * Operasi tulis belum diimplementasikan.
 */
function belumDiimplementasikan(): Hasil {
    return {
        ok: false,
        alasan: 'TIDAK_DIKENAL',
        pesan: 'Service sesi belum diimplementasikan.',
    };
}

/**
 * Membuat sesi baru.
 * Implementasi sebenarnya menjadi tanggung jawab Azka.
 */
export async function buatSesi(
    input: InputBuatSesi,
): Promise<Hasil> {
    void input;
    return belumDiimplementasikan();
}

/**
 * Mengubah jadwal atau informasi sesi.
 */
export async function ubahSesi(
    idSesi: string,
    data: InputUbahSesi,
): Promise<Hasil> {
    void idSesi;
    void data;
    return belumDiimplementasikan();
}

/**
 * Mengarsipkan sesi.
 */
export async function arsipkanSesi(
    idSesi: string,
): Promise<Hasil> {
    void idSesi;
    return belumDiimplementasikan();
}

/**
 * Membuka sesi presensi.
 */
export async function bukaSesi(
    idSesi: string,
): Promise<Hasil> {
    void idSesi;
    return belumDiimplementasikan();
}

/**
 * Menutup sesi presensi.
 */
export async function tutupSesi(
    idSesi: string,
): Promise<Hasil> {
    void idSesi;
    return belumDiimplementasikan();
}

/**
 * Mendengarkan daftar sesi berdasarkan kelas.
 *
 * Stub memberikan data contoh secara asynchronous.
 * Fungsi cleanup dikembalikan secara sinkron.
 */
export function listenSesiKelas(
    idKelas: string,
    callback: (sesi: Sesi[]) => void,
    onError: (error: Error) => void,
): () => void {
    void onError;

    let aktif = true;

    const dataContoh: Sesi[] = [
        {
            idSesi: 'stub-sesi-1',
            kelasId: idKelas,
            judul: 'Contoh Sesi (data stub)',
            lokasi: 'Laboratorium Contoh',
            waktuMulai: new Date(),
            waktuSelesai: null,
            statusSesi: 'BELUM_DIBUKA',
            diarsipkan: false,
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
 * Mendengarkan detail sesi berdasarkan ID.
 */
export function listenSesiById(
    idSesi: string,
    callback: (sesi: Sesi | null) => void,
    onError: (error: Error) => void,
): () => void {
    void onError;

    let aktif = true;

    const dataContoh: Sesi = {
        idSesi,
        kelasId: 'stub-kelas-1',
        judul: 'Contoh Sesi (data stub)',
        lokasi: 'Laboratorium Contoh',
        waktuMulai: new Date(),
        waktuSelesai: null,
        statusSesi: 'BELUM_DIBUKA',
        diarsipkan: false,
    };

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
 * Mengambil kode QR rahasia milik sesi.
 * Hanya asisten pemilik kelas yang nantinya berhak mengakses.
 */
export async function ambilKodeQr(
    idSesi: string,
): Promise<Hasil<string>> {
    void idSesi;

    return {
        ok: false,
        alasan: 'TIDAK_DIKENAL',
        pesan: 'Pengambilan kode QR belum diimplementasikan.',
    };
}