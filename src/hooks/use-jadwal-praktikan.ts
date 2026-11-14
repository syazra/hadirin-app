import {
    collection,
    doc,
    onSnapshot,
    query,
    where,
} from '@react-native-firebase/firestore';
import { useCallback, useEffect, useState } from 'react';

import {
    getFirebaseServices,
    isFirebaseAvailable,
} from '@/lib/firebase';
import { listenSesiKelas } from '@/services/sesi-service';
import type { Sesi } from '@/types';

interface StateJadwal {
    uid: string;
    retryKey: number;
    sesi: Sesi[];
    loading: boolean;
    error: string | null;
}

export interface HasilUseJadwalPraktikan {
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
        return 'Anda tidak memiliki izin untuk memuat jadwal praktikum.';
    }

    if (pesan.includes('unauthenticated')) {
        return 'Sesi login Anda telah berakhir. Silakan masuk kembali.';
    }

    return error.message.trim().length > 0
        ? error.message
        : 'Gagal memuat jadwal praktikan.';
}

/**
 * Hook listener jadwal sesi untuk praktikan berdasarkan keanggotaan AKTIF.
 * Kelas yang diarsipkan dikeluarkan dari jadwal meskipun keanggotaannya masih AKTIF.
 */
export function useJadwalPraktikan(
    uid: string | null,
): HasilUseJadwalPraktikan {
    const [state, setState] = useState<StateJadwal | null>(null);
    const [retryKey, setRetryKey] = useState(0);

    const muatUlang = useCallback(() => {
        setRetryKey((prev) => prev + 1);
    }, []);

    useEffect(() => {
        if (!uid || !isFirebaseAvailable) {
            return;
        }

        const uidAktif = uid;
        const retryAktif = retryKey;

        let aktif = true;
        const { db } = getFirebaseServices();

        let unsubscribeKeanggotaan: (() => void) | undefined;
        let unsubscribeKelas: (() => void)[] = [];
        const unsubscribeSesiPerKelas = new Map<string, () => void>();

        const sesiPerKelas = new Map<string, Sesi[]>();
        const kelasBelumDimuat = new Set<string>();
        const sesiBelumDimuat = new Set<string>();
        const errorPerKelas = new Map<string, string>();
        let errorKeanggotaan: string | null = null;

        function bersihkanListenerKelasDanSesi() {
            unsubscribeKelas.forEach((unsubscribe) => unsubscribe());
            unsubscribeKelas = [];

            unsubscribeSesiPerKelas.forEach((unsubscribe) => unsubscribe());
            unsubscribeSesiPerKelas.clear();
        }

        function hentikanListenerSesiKelas(kelasId: string) {
            const unsubscribe = unsubscribeSesiPerKelas.get(kelasId);
            if (unsubscribe) {
                unsubscribe();
                unsubscribeSesiPerKelas.delete(kelasId);
            }
            sesiPerKelas.delete(kelasId);
            sesiBelumDimuat.delete(kelasId);
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
                errorKeanggotaan ??
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

        function sedangMemuat(): boolean {
            return kelasBelumDimuat.size > 0 || sesiBelumDimuat.size > 0;
        }

        const qKeanggotaan = query(
            collection(db, 'keanggotaan'),
            where('uid', '==', uidAktif),
            where('status', '==', 'AKTIF'),
        );

        unsubscribeKeanggotaan = onSnapshot(
            qKeanggotaan,
            (snapshot) => {
                if (!aktif) {
                    return;
                }

                // Hentikan listener kelas & sesi lama sebelum membangun langganan baru.
                bersihkanListenerKelasDanSesi();
                sesiPerKelas.clear();
                kelasBelumDimuat.clear();
                sesiBelumDimuat.clear();
                errorPerKelas.clear();
                errorKeanggotaan = null;

                const kelasIds = Array.from(
                    new Set(
                        snapshot.docs
                            .map((docSnap) => docSnap.data().kelasId)
                            .filter(
                                (id): id is string =>
                                    typeof id === 'string' &&
                                    id.trim().length > 0,
                            ),
                    ),
                );

                // Tanpa keanggotaan aktif, langsung kembalikan daftar kosong tanpa query lanjutan.
                if (kelasIds.length === 0) {
                    publikasikan(false);
                    return;
                }

                kelasIds.forEach((kelasId) => {
                    kelasBelumDimuat.add(kelasId);
                });

                for (const kelasId of kelasIds) {
                    const unsubKelas = onSnapshot(
                        doc(db, 'kelas', kelasId),
                        (kelasSnap) => {
                            if (!aktif) {
                                return;
                            }

                            kelasBelumDimuat.delete(kelasId);
                            const kelasData = kelasSnap.data();

                            // Keluarkan kelas yang tidak ada atau sudah diarsipkan.
                            if (!kelasData || kelasData.diarsipkan === true) {
                                errorPerKelas.delete(kelasId);
                                hentikanListenerSesiKelas(kelasId);
                                publikasikan(sedangMemuat());
                                return;
                            }

                            if (!unsubscribeSesiPerKelas.has(kelasId)) {
                                sesiBelumDimuat.add(kelasId);

                                const unsubSesi = listenSesiKelas(
                                    kelasId,
                                    (daftarSesi) => {
                                        if (!aktif) {
                                            return;
                                        }

                                        errorPerKelas.delete(kelasId);
                                        sesiPerKelas.set(
                                            kelasId,
                                            daftarSesi.filter(
                                                (sesi) => !sesi.diarsipkan,
                                            ),
                                        );
                                        sesiBelumDimuat.delete(kelasId);

                                        publikasikan(sedangMemuat());
                                    },
                                    (error) => {
                                        if (!aktif) {
                                            return;
                                        }

                                        errorPerKelas.set(
                                            kelasId,
                                            formatPesanError(error),
                                        );
                                        sesiBelumDimuat.delete(kelasId);

                                        publikasikan(sedangMemuat());
                                    },
                                );

                                if (!aktif) {
                                    unsubSesi();
                                    return;
                                }

                                unsubscribeSesiPerKelas.set(kelasId, unsubSesi);
                            }

                            publikasikan(sedangMemuat());
                        },
                        (error) => {
                            if (!aktif) {
                                return;
                            }

                            kelasBelumDimuat.delete(kelasId);
                            errorPerKelas.set(
                                kelasId,
                                formatPesanError(error),
                            );
                            hentikanListenerSesiKelas(kelasId);

                            publikasikan(sedangMemuat());
                        },
                    );

                    if (!aktif) {
                        unsubKelas();
                        break;
                    }

                    unsubscribeKelas.push(unsubKelas);
                }
            },
            (error) => {
                if (!aktif) {
                    return;
                }

                bersihkanListenerKelasDanSesi();
                sesiPerKelas.clear();
                kelasBelumDimuat.clear();
                sesiBelumDimuat.clear();
                errorPerKelas.clear();
                errorKeanggotaan = formatPesanError(error);

                publikasikan(false);
            },
        );

        return () => {
            aktif = false;
            unsubscribeKeanggotaan?.();
            bersihkanListenerKelasDanSesi();
        };
    }, [uid, retryKey]);

    const stateAktif =
        uid && state?.uid === uid && state.retryKey === retryKey
            ? state
            : null;

    return {
        sesi: stateAktif?.sesi ?? [],
        loading: uid && isFirebaseAvailable ? (stateAktif?.loading ?? true) : false,
        error: !isFirebaseAvailable
            ? 'Firebase Hadir.in saat ini hanya tersedia di Android.'
            : (stateAktif?.error ?? null),
        muatUlang,
    };
}