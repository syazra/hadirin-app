import { useEffect, useState } from 'react';

import { listenSesiById } from '@/services/sesi-service';

import type { Sesi } from '@/types';

interface StateSesi {
    idSesi: string;
    data: Sesi | null;
    loading: boolean;
    error: string | null;
}

export function useSesiDetail(idSesi: string | null) {
    const [state, setState] = useState<StateSesi | null>(null);

    useEffect(() => {
        if (!idSesi) return;

        let aktif = true;

        const unsubscribe = listenSesiById(
            idSesi,
            (data) => {
                if (!aktif) return;

                setState({
                    idSesi,
                    data,
                    loading: false,
                    error: null,
                });
            },
            (error) => {
                if (!aktif) return;

                setState({
                    idSesi,
                    data: null,
                    loading: false,
                    error: error.message,
                });
            },
        );

        return () => {
            aktif = false;
            unsubscribe();
        };
    }, [idSesi]);

    // Jangan tampilkan detail sesi sebelumnya ketika ID berubah.
    const stateAktif =
        idSesi && state?.idSesi === idSesi ? state : null;

    return {
        sesi: stateAktif?.data ?? null,
        loading: idSesi ? stateAktif?.loading ?? true : false,
        error: stateAktif?.error ?? null,
    };
}