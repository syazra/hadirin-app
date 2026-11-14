import { useEffect, useState } from 'react';

import { listenIzinKelas } from '@/services/izin-service';

import type { Izin } from '@/types';

interface StateIzinAsisten {
    kelasId: string;
    data: Izin[];
    loading: boolean;
    error: string | null;
}

export function useIzinAsisten(kelasId: string | null) {
    const [state, setState] = useState<StateIzinAsisten | null>(null);

    useEffect(() => {
        if (!kelasId) return;

        const kelasAktif = kelasId;
        let aktif = true;

        const unsubscribe = listenIzinKelas(
            kelasAktif,
            (data) => {
                if (!aktif) return;

                setState({
                    kelasId: kelasAktif,
                    data,
                    loading: false,
                    error: null,
                });
            },
            (error) => {
                if (!aktif) return;

                setState({
                    kelasId: kelasAktif,
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

    // Jangan menampilkan data dari kelas sebelumnya.
    const stateAktif =
        kelasId && state?.kelasId === kelasId ? state : null;

    return {
        izin: stateAktif?.data ?? [],
        loading: kelasId ? stateAktif?.loading ?? true : false,
        error: stateAktif?.error ?? null,
    };
}