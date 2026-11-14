import { doc, onSnapshot, Timestamp } from '@react-native-firebase/firestore';
import { useCallback, useEffect, useState } from 'react';

import {
    getFirebaseServices,
    isFirebaseAvailable,
} from '@/lib/firebase';
import { listenSesiById } from '@/services/sesi-service';
import type { Kelas, Sesi } from '@/types';

interface StateSesi {
    idSesi: string;
    retryKey: number;
    data: Sesi | null;
    kelas: Kelas | null;
    loading: boolean;
    error: string | null;
}

export interface HasilUseSesiDetail {
    sesi: Sesi | null;
    kelas: Kelas | null;
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
        return 'Anda tidak memiliki izin untuk mengakses detail sesi ini.';
    }

    if (pesan.includes('unauthenticated')) {
        return 'Sesi login Anda telah berakhir. Silakan masuk kembali.';
    }

    return error.message.trim().length > 0
        ? error.message
        : 'Gagal memuat detail sesi.';
}

function konversiKeDate(nilai: unknown): Date | null {
    if (nilai === null || nilai === undefined) {
        return null;
    }

    if (nilai instanceof Timestamp) {
        return nilai.toDate();
    }

    if (nilai instanceof Date) {
        return Number.isNaN(nilai.getTime()) ? null : nilai;
    }

    if (
        typeof nilai === 'object' &&
        'toDate' in nilai &&
        typeof (nilai as { toDate: unknown }).toDate === 'function'
    ) {
        const hasil = (nilai as { toDate: () => Date }).toDate();
        return hasil instanceof Date && !Number.isNaN(hasil.getTime())
            ? hasil
            : null;
    }

    return null;
}

/**
 * Hook listener detail sesi berdasarkan ID, beserta informasi kelas induknya.
 * Mendukung akses sesi aktif maupun akses riwayat pribadi (termasuk data yang diarsipkan).
 */
export function useSesiDetail(
    idSesi: string | null,
): HasilUseSesiDetail {
    const [state, setState] = useState<StateSesi | null>(null);
    const [retryKey, setRetryKey] = useState(0);

    const muatUlang = useCallback(() => {
        setRetryKey((prev) => prev + 1);
    }, []);

    useEffect(() => {
        const idSesiRapi = typeof idSesi === 'string' ? idSesi.trim() : '';
        if (idSesiRapi.length === 0) {
            return;
        }

        const retryAktif = retryKey;
        let aktif = true;
        let kelasIdAktif: string | null = null;
        let unsubscribeKelas: (() => void) | undefined;

        function bersihkanListenerKelas() {
            unsubscribeKelas?.();
            unsubscribeKelas = undefined;
            kelasIdAktif = null;
        }

        const unsubscribeSesi = listenSesiById(
            idSesiRapi,
            (dataSesi) => {
                if (!aktif) {
                    return;
                }

                if (!dataSesi) {
                    bersihkanListenerKelas();
                    setState({
                        idSesi: idSesiRapi,
                        retryKey: retryAktif,
                        data: null,
                        kelas: null,
                        loading: false,
                        error: null,
                    });
                    return;
                }

                // Jika kelasId berubah atau listener kelas belum terpasang, pasang listener kelas.
                if (
                    dataSesi.kelasId.trim().length > 0 &&
                    kelasIdAktif !== dataSesi.kelasId &&
                    isFirebaseAvailable
                ) {
                    bersihkanListenerKelas();
                    kelasIdAktif = dataSesi.kelasId;

                    setState((prev) => ({
                        idSesi: idSesiRapi,
                        retryKey: retryAktif,
                        data: dataSesi,
                        kelas:
                            prev?.idSesi === idSesiRapi &&
                            prev.kelas?.idKelas === dataSesi.kelasId
                                ? prev.kelas
                                : null,
                        loading: true,
                        error: null,
                    }));

                    const { db } = getFirebaseServices();
                    unsubscribeKelas = onSnapshot(
                        doc(db, 'kelas', dataSesi.kelasId),
                        (kelasSnap) => {
                            if (!aktif) {
                                return;
                            }

                            const kelasData = kelasSnap.data();
                            const kelas: Kelas | null = kelasData
                                ? {
                                      idKelas: kelasSnap.id,
                                      namaPraktikum:
                                          typeof kelasData.namaPraktikum ===
                                          'string'
                                              ? kelasData.namaPraktikum
                                              : '',
                                      asistenUid:
                                          typeof kelasData.asistenUid ===
                                          'string'
                                              ? kelasData.asistenUid
                                              : '',
                                      diarsipkan: Boolean(kelasData.diarsipkan),
                                      dibuatPada: konversiKeDate(
                                          kelasData.dibuatPada,
                                      ),
                                  }
                                : null;

                            setState((prev) => ({
                                idSesi: idSesiRapi,
                                retryKey: retryAktif,
                                data:
                                    prev?.idSesi === idSesiRapi && prev.data
                                        ? prev.data
                                        : dataSesi,
                                kelas,
                                loading: false,
                                error: null,
                            }));
                        },
                        (error) => {
                            if (!aktif) {
                                return;
                            }

                            setState((prev) => ({
                                idSesi: idSesiRapi,
                                retryKey: retryAktif,
                                data:
                                    prev?.idSesi === idSesiRapi && prev.data
                                        ? prev.data
                                        : dataSesi,
                                kelas: null,
                                loading: false,
                                error: formatPesanError(error),
                            }));
                        },
                    );
                    return;
                }

                setState((prev) => ({
                    idSesi: idSesiRapi,
                    retryKey: retryAktif,
                    data: dataSesi,
                    kelas:
                        prev?.idSesi === idSesiRapi ? prev.kelas : null,
                    loading: false,
                    error: null,
                }));
            },
            (error) => {
                if (!aktif) {
                    return;
                }

                bersihkanListenerKelas();
                setState({
                    idSesi: idSesiRapi,
                    retryKey: retryAktif,
                    data: null,
                    kelas: null,
                    loading: false,
                    error: formatPesanError(error),
                });
            },
        );

        return () => {
            aktif = false;
            unsubscribeSesi();
            bersihkanListenerKelas();
        };
    }, [idSesi, retryKey]);

    const idSesiRapi = typeof idSesi === 'string' ? idSesi.trim() : '';
    const stateAktif =
        idSesiRapi.length > 0 &&
        state?.idSesi === idSesiRapi &&
        state.retryKey === retryKey
            ? state
            : null;

    return {
        sesi: stateAktif?.data ?? null,
        kelas: stateAktif?.kelas ?? null,
        loading: idSesiRapi.length > 0 ? (stateAktif?.loading ?? true) : false,
        error: stateAktif?.error ?? null,
        muatUlang,
    };
}