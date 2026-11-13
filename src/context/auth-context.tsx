import {
    createContext,
    useEffect,
    useMemo,
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

    useEffect(() => {
    if (!isFirebaseAvailable) return;

    let aktif = true;
    let nomorPermintaan = 0;

    const { auth } = getFirebaseServices();

    const unsubscribe = onAuthStateChanged(
        auth,
        async (akun) => {
            const permintaanSaatIni = ++nomorPermintaan;

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

            if (!aktif || permintaanSaatIni !== nomorPermintaan) {
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
    );

    return () => {
        aktif = false;
        nomorPermintaan++;
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
        }),
        [pengguna, loading, profilBelumLengkap, error],
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}