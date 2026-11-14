import { listenKelasAsisten } from '@/services/kelas-service';
import type { Kelas } from '@/types';
import { useCallback, useEffect, useState } from 'react';

interface StateKelas {
    uid: string;
    data: Kelas[];
    loading: boolean;
    error: string | null;
}

function formatPesanError(error: Error): string {
    const rawKode =
        'code' in error ? String((error as { code?: unknown }).code ?? '') : '';
    const kode = rawKode.replace(/^firestore\//, '');

    switch (kode) {
        case 'permission-denied':
            return 'Anda tidak memiliki izin untuk melihat daftar kelas.';
        case 'unauthenticated':
            return 'Sesi login berakhir. Silakan masuk kembali.';
        case 'unavailable':
        case 'network-request-failed':
            return 'Koneksi terputus. Periksa jaringan Anda lalu coba lagi.';
        case 'deadline-exceeded':
            return 'Permintaan melebihi batas waktu. Silakan coba lagi.';
        default:
            return error.message || 'Gagal memuat daftar kelas.';
    }
}

export function useKelasAsisten(uid: string | null) {
    const [state, setState] = useState<StateKelas | null>(null);
    const [retryKey, setRetryKey] = useState(0);

    const cobaLagi = useCallback(() => {
        setState(null);
        setRetryKey((prev) => prev + 1);
    }, []);

    useEffect(() => {
        const uidBersih = uid?.trim() ?? '';
        if (!uidBersih) return;

        let aktif = true;

        const unsubscribe = listenKelasAsisten(
            uidBersih,
            (data) => {
                if (!aktif) return;

                setState({
                    uid: uidBersih,
                    data,
                    loading: false,
                    error: null,
                });
            },
            (error) => {
                if (!aktif) return;

                setState({
                    uid: uidBersih,
                    data: [],
                    loading: false,
                    error: formatPesanError(error),
                });
            },
        );

        return () => {
            aktif = false;
            unsubscribe();
        };
    }, [uid, retryKey]);

    const uidBersih = uid?.trim() ?? '';

    // Hindari menampilkan data akun sebelumnya
    // ketika UID berubah atau pengguna logout.
    const stateAktif =
        uidBersih && state?.uid === uidBersih ? state : null;

    return {
        kelas: stateAktif?.data ?? [],
        loading: uidBersih ? stateAktif?.loading ?? true : false,
        error: stateAktif?.error ?? null,
        cobaLagi,
    };
}