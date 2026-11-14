import { useEffect, useState } from 'react';

import { listenPesertaKelas } from '@/services/peserta-service';

import type { Keanggotaan } from '@/types';

interface StatePeserta {
    kelasId: string;
    data: Keanggotaan[];
    loading: boolean;
    error: string | null;
}

export function usePesertaKelas(kelasId: string | null) {
    const [state, setState] = useState<StatePeserta | null>(null);

    useEffect(() => {
        if (!kelasId) return;

        let aktif = true;

        const unsubscribe = listenPesertaKelas(
            kelasId,
            (data) => {
                if (!aktif) return;

                setState({
                    kelasId,
                    data,
                    loading: false,
                    error: null,
                });
            },
            (error) => {
                if (!aktif) return;

                setState({
                    kelasId,
                    data: [],
                    loading: false,
                    error: error.message,
                });
            },
        );

        return () => {
            aktif = false;
            unsubscribe();
        };
    }, [kelasId]);

    // Mencegah data kelas sebelumnya tampil ketika kelas berubah.
    const stateAktif =
        kelasId && state?.kelasId === kelasId ? state : null;

    return {
        peserta: stateAktif?.data ?? [],
        loading: kelasId ? stateAktif?.loading ?? true : false,
        error: stateAktif?.error ?? null,
    };
}