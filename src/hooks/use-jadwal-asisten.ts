import { useEffect, useState } from 'react';

import { listenKelasAsisten } from '@/services/kelas-service';
import { listenSesiKelas } from '@/services/sesi-service';

import type { Sesi } from '@/types';

interface StateJadwal {
    uid: string;
    sesi: Sesi[];
    loading: boolean;
    error: string | null;
}

export function useJadwalAsisten(uid: string | null) {
    const [state, setState] = useState<StateJadwal | null>(null);

    useEffect(() => {
        if (!uid) return;

        const uidAktif = uid;
        let aktif = true;

        let unsubscribeKelas: (() => void) | undefined;
        let unsubscribeSesi: (() => void)[] = [];

        const sesiPerKelas = new Map<string, Sesi[]>();
        const sesiBelumDimuat = new Set<string>();

        let errorSaatIni: string | null = null;

        function publikasikan(loading: boolean) {
            const semuaSesi = Array.from(sesiPerKelas.values())
                .flat()
                .sort(
                    (a, b) =>
                        a.waktuMulai.getTime() - b.waktuMulai.getTime(),
                );

            setState({
                uid: uidAktif,
                sesi: semuaSesi,
                loading,
                error: errorSaatIni,
            });
        }

        unsubscribeKelas = listenKelasAsisten(
            uid,
            (daftarKelas) => {
                if (!aktif) return;

                // Hentikan listener kelas lama sebelum memasang yang baru.
                unsubscribeSesi.forEach((unsubscribe) => unsubscribe());
                unsubscribeSesi = [];

                sesiPerKelas.clear();
                sesiBelumDimuat.clear();
                errorSaatIni = null;

                const kelasAktif = daftarKelas.filter(
                    (kelas) => !kelas.diarsipkan,
                );

                if (kelasAktif.length === 0) {
                    publikasikan(false);
                    return;
                }

                kelasAktif.forEach((kelas) => {
                    sesiBelumDimuat.add(kelas.idKelas);
                });

                kelasAktif.forEach((kelas) => {
                    const unsubscribe = listenSesiKelas(
                        kelas.idKelas,
                        (daftarSesi) => {
                            if (!aktif) return;

                            sesiPerKelas.set(
                                kelas.idKelas,
                                daftarSesi.filter((sesi) => !sesi.diarsipkan),
                            );

                            sesiBelumDimuat.delete(kelas.idKelas);

                            publikasikan(sesiBelumDimuat.size > 0);
                        },
                        (error) => {
                            if (!aktif) return;

                            errorSaatIni = error.message;
                            sesiBelumDimuat.delete(kelas.idKelas);

                            publikasikan(sesiBelumDimuat.size > 0);
                        },
                    );

                    unsubscribeSesi.push(unsubscribe);
                });
            },
            (error) => {
                if (!aktif) return;

                errorSaatIni = error.message;
                publikasikan(false);
            },
        );

        return () => {
            aktif = false;

            unsubscribeKelas?.();
            unsubscribeSesi.forEach((unsubscribe) => unsubscribe());
        };
    }, [uid]);

    const stateAktif =
        uid && state?.uid === uid ? state : null;

    return {
        sesi: stateAktif?.sesi ?? [],
        loading: uid ? stateAktif?.loading ?? true : false,
        error: stateAktif?.error ?? null,
    };
}