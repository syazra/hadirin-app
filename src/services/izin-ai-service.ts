import { getIdToken } from '@react-native-firebase/auth';

import { getFirebaseServices } from '@/lib/firebase';
import type { AlasanGagal, Hasil, KategoriIzin } from '@/types';
import { hasilErrorFirebase } from '@/utils/error-firebase';

const KATEGORI_IZIN: readonly KategoriIzin[] = [
    'SAKIT',
    'IZIN',
    'ALPHA',
];

const ALASAN_GAGAL: readonly AlasanGagal[] = [
    'INPUT_TIDAK_VALID',
    'AUTENTIKASI_GAGAL',
    'TIDAK_BERWENANG',
    'DATA_TIDAK_DITEMUKAN',
    'JARINGAN',
    'TIMEOUT',
    'KUOTA_HABIS',
    'RESPONS_TIDAK_VALID',
    'TIDAK_DIKENAL',
];

function adalahObjek(nilai: unknown): nilai is Record<string, unknown> {
    return typeof nilai === 'object' && nilai !== null && !Array.isArray(nilai);
}

function normalisasiKategoriIzin(nilai: unknown): KategoriIzin | null {
    if (typeof nilai !== 'string') return null;
    const atas = nilai.trim().toUpperCase();

    if (KATEGORI_IZIN.includes(atas as KategoriIzin)) {
        return atas as KategoriIzin;
    }

    // Kompatibilitas mundur jika endpoint proxy masih mengembalikan label lama
    if (atas === 'KESEHATAN') return 'SAKIT';
    if (atas === 'KELUARGA' || atas === 'AKADEMIK' || atas === 'LAINNYA') {
        return 'IZIN';
    }
    if (atas === 'TIDAK_JELAS') return 'ALPHA';

    return null;
}

/** Meminta klasifikasi dari proxy tanpa pernah mengirim kunci Gemini dari aplikasi. */
export async function klasifikasikanIzin(
    idIzin: string,
): Promise<Hasil<{ kategori: KategoriIzin }>> {
    const baseUrl = process.env.EXPO_PUBLIC_GEMINI_PROXY_URL?.trim().replace(/\/$/, '');
    if (!baseUrl) {
        return {
            ok: false,
            alasan: 'TIDAK_DIKENAL',
            pesan: 'Alamat layanan klasifikasi belum dikonfigurasi.',
        };
    }

    try {
        const { auth } = getFirebaseServices();
        const user = auth.currentUser;
        if (!user) {
            return {
                ok: false,
                alasan: 'AUTENTIKASI_GAGAL',
                pesan: 'Silakan login kembali untuk mengklasifikasikan izin.',
            };
        }

        const token = await getIdToken(user);
        const response = await fetch(`${baseUrl}/api/klasifikasi-izin`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idIzin }),
        });

        let body: unknown;
        try {
            body = await response.json();
        } catch {
            return {
                ok: false,
                alasan: 'RESPONS_TIDAK_VALID',
                pesan: 'Respons layanan klasifikasi tidak dapat dibaca.',
            };
        }

        if (response.ok && adalahObjek(body) && body.ok === true && adalahObjek(body.data)) {
            const kategori = normalisasiKategoriIzin(body.data.kategori);
            if (kategori) {
                return { ok: true, data: { kategori } };
            }
            return {
                ok: false,
                alasan: 'RESPONS_TIDAK_VALID',
                pesan: 'Respons layanan klasifikasi berisi kategori yang tidak dikenal.',
            };
        }

        if (adalahObjek(body) && typeof body.alasan === 'string' && ALASAN_GAGAL.includes(body.alasan as AlasanGagal)) {
            return {
                ok: false,
                alasan: body.alasan as AlasanGagal,
                pesan: typeof body.pesan === 'string' ? body.pesan : 'Klasifikasi izin gagal.',
            };
        }

        return {
            ok: false,
            alasan: 'TIDAK_DIKENAL',
            pesan: 'Layanan klasifikasi izin gagal memproses permintaan.',
        };
    } catch (error) {
        if (error instanceof TypeError) {
            return { ok: false, alasan: 'JARINGAN', pesan: 'Layanan klasifikasi tidak dapat dijangkau.' };
        }
        return hasilErrorFirebase(error);
    }
}