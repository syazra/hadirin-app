export const MAKS_TEKS_SESI = 100;

export type FieldErrorSesi = 'judul' | 'lokasi' | 'waktuMulai' | 'waktuSelesai';

export type DataSesiTervalidasi = {
    judul: string;
    lokasi: string;
    waktuMulai: Date;
    waktuSelesai: Date | null;
};

export type HasilValidasiSesi =
    | { valid: true; data: DataSesiTervalidasi }
    | { valid: false; field: FieldErrorSesi; pesan: string };

/**
 * Validasi input form & service sesi sesuai Kontrak Data v1.1 (bagian 1.5).
 * Service memetakan `{ valid: false, pesan }` ke `Hasil` dengan alasan `'INPUT_TIDAK_VALID'`.
 */
export function validasiSesi(
    judul: string,
    lokasi: string,
    waktuMulai: Date,
    waktuSelesai: Date | null,
): HasilValidasiSesi {
    const judulBersih = judul.trim();
    if (judulBersih.length === 0) {
        return {
            valid: false,
            field: 'judul',
            pesan: 'Judul sesi wajib diisi.',
        };
    }
    if (judulBersih.length > MAKS_TEKS_SESI) {
        return {
            valid: false,
            field: 'judul',
            pesan: `Judul sesi maksimal ${MAKS_TEKS_SESI} karakter.`,
        };
    }

    const lokasiBersih = lokasi.trim();
    if (lokasiBersih.length === 0) {
        return {
            valid: false,
            field: 'lokasi',
            pesan: 'Lokasi sesi wajib diisi.',
        };
    }
    if (lokasiBersih.length > MAKS_TEKS_SESI) {
        return {
            valid: false,
            field: 'lokasi',
            pesan: `Lokasi sesi maksimal ${MAKS_TEKS_SESI} karakter.`,
        };
    }

    if (!(waktuMulai instanceof Date) || Number.isNaN(waktuMulai.getTime())) {
        return {
            valid: false,
            field: 'waktuMulai',
            pesan: 'Waktu mulai tidak valid.',
        };
    }

    if (waktuSelesai !== null) {
        if (!(waktuSelesai instanceof Date) || Number.isNaN(waktuSelesai.getTime())) {
            return {
                valid: false,
                field: 'waktuSelesai',
                pesan: 'Waktu selesai tidak valid.',
            };
        }
        if (waktuSelesai.getTime() <= waktuMulai.getTime()) {
            return {
                valid: false,
                field: 'waktuSelesai',
                pesan: 'Waktu selesai harus lebih besar dari waktu mulai.',
            };
        }
    }

    return {
        valid: true,
        data: {
            judul: judulBersih,
            lokasi: lokasiBersih,
            waktuMulai,
            waktuSelesai,
        },
    };
}