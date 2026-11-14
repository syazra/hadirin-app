import { useCallback, useEffect, useState } from 'react';

import { listenKelasAsisten } from '@/services/kelas-service';
import { listenSesiKelas } from '@/services/sesi-service';
import type { Sesi } from '@/types';

interface StateJadwal {
    uid: string;
    retryKey: number;
    sesi: Sesi[];
    loading: boolean;
    error: string | null;
}

export interface HasilUseJadwalAsisten {
    sesi: Sesi[];
    loading: boolean;
    error: string | null;
    muatUlang: () => void;
}

function formatPesanError(error: Error): string {
    const pesan = error.message.toLowerCase();

    if (
        pesan.includes('unavailable') ||
        pesan.includes('network') ||
        pesan.includes('offline')
    ) {
        return 'Koneksi ke server terganggu. Periksa jaringan Anda lalu coba lagi.';
    }

    if (pesan.includes('permission-denied')) {
        return 'Anda tidak memiliki izin untuk memuat jadwal sesi ini.';
    }

    if (pesan.includes('unauthenticated')) {
        return 'Sesi login Anda telah berakhir. Silakan masuk kembali.';
    }

    return error.message.trim().length > 0
        ? error.message
        : 'Gagal memuat jadwal asisten.';
}

/**
 * Hook listener jadwal sesi milik asisten.
 * Menggabungkan seluruh sesi dari kelas aktif (tidak diarsipkan)
 * dan mengurutkannya berdasarkan waktuMulai menaik.
 */
export function useJadwalAsisten(uid: string | null): HasilUseJadwalAsisten {
    const [state, setState] = useState<StateJadwal | null>(null);
    const [retryKey, setRetryKey] = useState(0);

    const muatUlang = useCallback(() => {
        setRetryKey((prev) => prev + 1);
    }, []);

    useEffect(() => {
        if (!uid) {
            return;
        }

        const uidAktif = uid;
        const retryAktif = retryKey;
        let aktif = true;

        let unsubscribeKelas: (() => void) | undefined;
        let unsubscribeSesi: (() => void)[] = [];

        const sesiPerKelas = new Map<string, Sesi[]>();
        const sesiBelumDimuat = new Set<string>();
        const errorPerKelas = new Map<string, string>();
        let errorKelas: string | null = null;

        function bersihkanListenerSesi() {
            unsubscribeSesi.forEach((unsubscribe) => unsubscribe());
            unsubscribeSesi = [];
        }

        function publikasikan(loading: boolean) {
            if (!aktif) {
                return;
            }

            const semuaSesi = Array.from(sesiPerKelas.values())
                .flat()
                .sort(
                    (a, b) =>
                        a.waktuMulai.getTime() - b.waktuMulai.getTime(),
                );

            const errorGabungan =
                errorKelas ??
                errorPerKelas.values().next().value ??
                null;

            setState({
                uid: uidAktif,
                retryKey: retryAktif,
                sesi: semuaSesi,
                loading,
                error: errorGabungan,
            });
        }

        unsubscribeKelas = listenKelasAsisten(
            uidAktif,
            (daftarKelas) => {
                if (!aktif) {
                    return;
                }

                // Hentikan listener sesi lama sebelum memasang langganan baru.
                bersihkanListenerSesi();
                sesiPerKelas.clear();
                sesiBelumDimuat.clear();
                errorPerKelas.clear();
                errorKelas = null;

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

                for (const kelas of kelasAktif) {
                    const unsubscribe = listenSesiKelas(
                        kelas.idKelas,
                        (daftarSesi) => {
                            if (!aktif) {
                                return;
                            }

                            errorPerKelas.delete(kelas.idKelas);
                            sesiPerKelas.set(
                                kelas.idKelas,
                                daftarSesi.filter((sesi) => !sesi.diarsipkan),
                            );
                            sesiBelumDimuat.delete(kelas.idKelas);

                            publikasikan(sesiBelumDimuat.size > 0);
                        },
                        (error) => {
                            if (!aktif) {
                                return;
                            }

                            errorPerKelas.set(
                                kelas.idKelas,
                                formatPesanError(error),
                            );
                            sesiBelumDimuat.delete(kelas.idKelas);

                            publikasikan(sesiBelumDimuat.size > 0);
                        },
                    );

                    if (!aktif) {
                        unsubscribe();
                        break;
                    }

                    unsubscribeSesi.push(unsubscribe);
                }
            },
            (error) => {
                if (!aktif) {
                    return;
                }

                bersihkanListenerSesi();
                sesiPerKelas.clear();
                sesiBelumDimuat.clear();
                errorPerKelas.clear();
                errorKelas = formatPesanError(error);

                publikasikan(false);
            },
        );

        return () => {
            aktif = false;
            unsubscribeKelas?.();
            bersihkanListenerSesi();
        };
    }, [uid, retryKey]);

    const stateAktif =
        uid && state?.uid === uid && state.retryKey === retryKey
            ? state
            : null;

    return {
        sesi: stateAktif?.sesi ?? [],
        loading: uid ? (stateAktif?.loading ?? true) : false,
        error: stateAktif?.error ?? null,
        muatUlang,
    };
}