import {
    createContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

import { onAuthStateChanged } from '@react-native-firebase/auth';

import { AuthSessionController } from '@/context/auth-session-controller';
import {
    getFirebaseServices,
    isFirebaseAvailable,
} from '@/lib/firebase';
import { ambilProfil } from '@/services/auth-service';
import type { Peran } from '@/types';

export interface AuthContextValue {
    pengguna: ReturnType<AuthSessionController['getSnapshot']>['pengguna'];
    loading: boolean;
    peran: Peran | null;
    profilBelumLengkap: boolean;
    error: string | null;
    muatUlangProfil: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

function buatAuthSessionController(): AuthSessionController {
    return new AuthSessionController({
        tersedia: isFirebaseAvailable,
        berlanggananAuth: (listener, onError) => {
            if (!isFirebaseAvailable) return () => undefined;

            const { auth } = getFirebaseServices();
            return onAuthStateChanged(
                auth,
                (akun) => listener(akun ? { uid: akun.uid } : null),
                onError,
            );
        },
        ambilUidAktif: () => {
            if (!isFirebaseAvailable) return null;
            return getFirebaseServices().auth.currentUser?.uid ?? null;
        },
        ambilProfil,
    });
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [controller] = useState(() => buatAuthSessionController());
    const [session, setSession] = useState(() => controller.getSnapshot());

    useEffect(() => {
        const unsubscribeState = controller.subscribe(setSession);
        const stop = controller.start();

        return () => {
            unsubscribeState();
            stop();
        };
    }, [controller]);

    const value = useMemo<AuthContextValue>(
        () => ({
            ...session,
            peran: session.pengguna?.peran ?? null,
            muatUlangProfil: controller.muatUlangProfil,
        }),
        [session, controller],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
