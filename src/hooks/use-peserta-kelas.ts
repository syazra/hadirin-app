import { listenPesertaKelas } from '@/services/peserta-service';
import type { Keanggotaan } from '@/types';
import { useCallback, useEffect, useState } from 'react';

interface StatePeserta {
    kelasId: string;
    data: Keanggotaan[];
    loading: boolean;
    error: string | null;
}

function formatPesanError(error: Error): string {
    const rawKode =
        'code' in error ? String((error as { code?: unknown }).code ?? '') : '';
    const kode = rawKode.replace(/^firestore\//, '');

    switch (kode) {
        case 'permission-denied':
            return 'Anda tidak memiliki izin untuk melihat daftar peserta kelas ini.';
        case 'unauthenticated':
            return 'Sesi login berakhir. Silakan masuk kembali.';
        case 'unavailable':
        case 'network-request-failed':
            return 'Koneksi terputus. Periksa jaringan Anda lalu coba lagi.';
        case 'deadline-exceeded':
            return 'Permintaan melebihi batas waktu. Silakan coba lagi.';
        default:
            return error.message || 'Gagal memuat daftar peserta kelas.';
    }
}

export function usePesertaKelas(kelasId: string | null) {
    const [state, setState] = useState<StatePeserta | null>(null);
    const [retryKey, setRetryKey] = useState(0);

    const cobaLagi = useCallback(() => {
        setState(null);
        setRetryKey((prev) => prev + 1);
    }, []);

    useEffect(() => {
        const kelasIdBersih = kelasId?.trim() ?? '';
        if (!kelasIdBersih) return;

        let aktif = true;

        const unsubscribe = listenPesertaKelas(
            kelasIdBersih,
            (data) => {
                if (!aktif) return;

                setState({
                    kelasId: kelasIdBersih,
                    data,
                    loading: false,
                    error: null,
                });
            },
            (error) => {
                if (!aktif) return;

                setState({
                    kelasId: kelasIdBersih,
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
    }, [kelasId, retryKey]);

    const kelasIdBersih = kelasId?.trim() ?? '';

    // Mencegah data kelas sebelumnya tampil ketika kelas berubah.
    const stateAktif =
        kelasIdBersih && state?.kelasId === kelasIdBersih ? state : null;

    return {
        peserta: stateAktif?.data ?? [],
        loading: kelasIdBersih ? stateAktif?.loading ?? true : false,
        error: stateAktif?.error ?? null,
        cobaLagi,
    };
}