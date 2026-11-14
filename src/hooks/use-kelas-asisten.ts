import { useEffect, useState } from 'react';

import { listenKelasAsisten } from '@/services/kelas-service';

import type { Kelas } from '@/types';

interface StateKelas {
    uid: string;
    data: Kelas[];
    loading: boolean;
    error: string | null;
}

export function useKelasAsisten(uid: string | null) {
    const [state, setState] = useState<StateKelas | null>(null);

    useEffect(() => {
        if (!uid) return;

        let aktif = true;

        const unsubscribe = listenKelasAsisten(
            uid,
            (data) => {
                if (!aktif) return;

                setState({
                    uid,
                    data,
                    loading: false,
                    error: null,
                });
            },
            (error) => {
                if (!aktif) return;

                setState({
                    uid,
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

    // Hindari menampilkan data akun sebelumnya
    // ketika UID berubah atau pengguna logout.
    const stateAktif = uid && state?.uid === uid
        ? state
        : null;

    return {
        kelas: stateAktif?.data ?? [],
        loading: uid ? stateAktif?.loading ?? true : false,
        error: stateAktif?.error ?? null,
    };
}