import { useEffect, useState } from 'react';

import { listenIzinPengguna } from '@/services/izin-service';

import type { Izin } from '@/types';

interface StateIzin {
    uid: string;
    data: Izin[];
    loading: boolean;
    error: string | null;
}

export function useIzinPengguna(uid: string | null) {
    const [state, setState] = useState<StateIzin | null>(null);

    useEffect(() => {
        if (!uid) return;

        const uidAktif = uid;
        let aktif = true;

        const unsubscribe = listenIzinPengguna(
            uidAktif,
            (data) => {
                if (!aktif) return;

                setState({
                    uid: uidAktif,
                    data,
                    loading: false,
                    error: null,
                });
            },
            (error) => {
                if (!aktif) return;

                setState({
                    uid: uidAktif,
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
    }, [uid]);

    const stateAktif =
        uid && state?.uid === uid ? state : null;

    return {
        izin: stateAktif?.data ?? [],
        loading: uid ? stateAktif?.loading ?? true : false,
        error: stateAktif?.error ?? null,
    };
}