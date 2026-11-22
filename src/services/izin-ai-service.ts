import { getIdToken } from '@react-native-firebase/auth';

import { getFirebaseServices } from '@/lib/firebase';
import type { AlasanGagal, Hasil, KategoriIzin } from '@/types';
import { adalahKategoriIzin, VERSI_KATEGORI_AI } from '@/utils/kategori-izin';
import { hasilErrorFirebase } from '@/utils/error-firebase';

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

const GAGAL_VERSI_PROXY = {
    ok: false,
    alasan: 'RESPONS_TIDAK_VALID',
    pesan: 'Versi layanan AI belum cocok dengan aplikasi. Hubungi pengelola aplikasi untuk memperbarui proxy AI.',
} as const;

function adalahObjek(nilai: unknown): nilai is Record<string, unknown> {
    return typeof nilai === 'object' && nilai !== null && !Array.isArray(nilai);
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
            body: JSON.stringify({ idIzin, versiKategoriAi: VERSI_KATEGORI_AI }),
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

        // Proxy lama menolak field versi sebelum mulai memproses izin.
        if (
            response.status === 400 &&
            adalahObjek(body) &&
            body.alasan === 'INPUT_TIDAK_VALID' &&
            !('versiKategoriAi' in body)
        ) {
            return GAGAL_VERSI_PROXY;
        }

        if (response.ok && adalahObjek(body) && body.ok === true && adalahObjek(body.data)) {
            if (body.versiKategoriAi !== VERSI_KATEGORI_AI) {
                return GAGAL_VERSI_PROXY;
            }
            const kategori = body.data.kategori;
            if (adalahKategoriIzin(kategori)) {
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