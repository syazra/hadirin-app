import type { AlasanGagal, Hasil } from '@/types';

function kodeError(error: unknown): string | null {
    if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        typeof error.code === 'string'
    ) {
        return error.code;
    }

    return null;
}

function gagal<T>(alasan: AlasanGagal, pesan: string): Hasil<T> {
    return { ok: false, alasan, pesan };
}

export function hasilErrorFirebase<T = never>(error: unknown): Hasil<T> {
    const code = kodeError(error);

    if (
        code === 'auth/invalid-email' ||
        code === 'auth/weak-password' ||
        code === 'auth/missing-email' ||
        code === 'auth/missing-password'
    ) {
        return gagal(
            'INPUT_TIDAK_VALID',
            'Periksa kembali format email dan ketentuan kata sandi.',
        );
    }

    if (code === 'auth/email-already-in-use') {
        return gagal(
            'AUTENTIKASI_GAGAL',
            'Email sudah terdaftar. Silakan masuk atau pulihkan profil.',
        );
    }

    if (
        code === 'auth/invalid-credential' ||
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-disabled' ||
        code === 'auth/too-many-requests'
    ) {
        return gagal(
            'AUTENTIKASI_GAGAL',
            'Email atau kata sandi tidak sesuai, atau akun sementara dibatasi.',
        );
    }

    if (
        code === 'auth/network-request-failed' ||
        code === 'firestore/unavailable' ||
        code === 'firestore/network-request-failed'
    ) {
        return gagal(
            'JARINGAN',
            'Koneksi bermasalah. Periksa jaringan lalu coba lagi.',
        );
    }

    if (
        code === 'firestore/deadline-exceeded' ||
        code === 'firestore/cancelled'
    ) {
        return gagal(
            'TIMEOUT',
            'Permintaan terlalu lama. Silakan coba lagi.',
        );
    }

    if (
        code === 'firestore/permission-denied' ||
        code === 'auth/operation-not-allowed'
    ) {
        return gagal(
            'TIDAK_BERWENANG',
            'Akses ditolak. Periksa konfigurasi Firebase dan Security Rules.',
        );
    }

    return gagal(
        'TIDAK_DIKENAL',
        'Terjadi kesalahan yang tidak dikenali. Silakan coba lagi.',
    );
}
