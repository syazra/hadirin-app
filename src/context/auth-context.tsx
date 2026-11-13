import {
    createContext,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';

import { onAuthStateChanged } from '@react-native-firebase/auth';

import {
    getFirebaseServices,
    isFirebaseAvailable,
} from '@/lib/firebase';

import { ambilProfil } from '@/services/auth-service';

import type {
    Pengguna,
    Peran,
} from '@/types';

export interface AuthContextValue {
    pengguna: Pengguna | null;
    loading: boolean;
    peran: Peran | null;
    profilBelumLengkap: boolean;
    error: string | null;
    muatUlangProfil: () => Promise<void>;
}

export const AuthContext = createContext<
    AuthContextValue | undefined
>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({
    children,
}: AuthProviderProps) {
    const [pengguna, setPengguna] = useState<Pengguna | null>(null);
    const [loading, setLoading] = useState(isFirebaseAvailable);
    const [profilBelumLengkap, setProfilBelumLengkap] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const nomorPermintaan = useRef(0);
    const providerAktif = useRef(false);

    const muatUlangProfil = useCallback(async () => {
        if (!isFirebaseAvailable) {
            setLoading(false);
            return;
        }
        if (!providerAktif.current) return;

        const permintaanSaatIni = ++nomorPermintaan.current;
        setLoading(true);
        setError(null);

        try {
            const { auth } = getFirebaseServices();
            const akun = auth.currentUser;

            if (!akun) {
                setPengguna(null);
                setProfilBelumLengkap(false);
                return;
            }

            const hasil = await ambilProfil(akun.uid);

            if (
                !providerAktif.current ||
                permintaanSaatIni !== nomorPermintaan.current
            ) return;

            if (hasil.ok) {
                setPengguna(hasil.data);
                setProfilBelumLengkap(false);
                setError(null);
            } else {
                setPengguna(null);
                setProfilBelumLengkap(
                    hasil.alasan === 'PROFIL_BELUM_LENGKAP',
                );
                setError(hasil.pesan);
            }
        } catch (kesalahan) {
            if (
                !providerAktif.current ||
                permintaanSaatIni !== nomorPermintaan.current
            ) return;

            setPengguna(null);
            setProfilBelumLengkap(false);
            setError(
                kesalahan instanceof Error
                    ? kesalahan.message
                    : 'Status akun belum dapat diperiksa.',
            );
        } finally {
            if (
                providerAktif.current &&
                permintaanSaatIni === nomorPermintaan.current
            ) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        if (!isFirebaseAvailable) return;

        let aktif = true;
        providerAktif.current = true;

        const { auth } = getFirebaseServices();

        const unsubscribe = onAuthStateChanged(
            auth,
            async (akun) => {
                const permintaanSaatIni = ++nomorPermintaan.current;

                if (!akun) {
                    setPengguna(null);
                    setProfilBelumLengkap(false);
                    setError(null);
                    setLoading(false);
                    return;
                }

                setPengguna(null);
                setProfilBelumLengkap(false);
                setError(null);
                setLoading(true);

                const hasil = await ambilProfil(akun.uid);

                if (!aktif || permintaanSaatIni !== nomorPermintaan.current) {
                    return;
                }

                if (hasil.ok) {
                    setPengguna(hasil.data);
                    setProfilBelumLengkap(false);
                    setError(null);
                } else {
                    setPengguna(null);
                    setProfilBelumLengkap(
                        hasil.alasan === 'PROFIL_BELUM_LENGKAP',
                    );
                    setError(hasil.pesan);
                }

                setLoading(false);
            },
            (kesalahan) => {
                if (!aktif) return;

                nomorPermintaan.current++;
                setPengguna(null);
                setProfilBelumLengkap(false);
                setError(kesalahan.message);
                setLoading(false);
            },
        );

        return () => {
            aktif = false;
            providerAktif.current = false;
            unsubscribe();
        };
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            pengguna,
            loading,
            peran: pengguna?.peran ?? null,
            profilBelumLengkap,
            error,
            muatUlangProfil,
        }),
        [pengguna, loading, profilBelumLengkap, error, muatUlangProfil],
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
