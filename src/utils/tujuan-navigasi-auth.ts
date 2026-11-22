import type { Pengguna } from '@/types';

export type TujuanNavigasiAuth =
    | '/(auth)/login'
    | '/(asisten)/(tabs)/beranda-asisten'
    | '/(praktikan)/(tabs)/beranda-praktikan';

export function tentukanTujuanNavigasiAuth(state: {
    pengguna: Pengguna | null;
    loading: boolean;
    profilBelumLengkap: boolean;
}): TujuanNavigasiAuth | null {
    if (state.loading) return null;
    if (!state.pengguna || state.profilBelumLengkap) return '/(auth)/login';

    return state.pengguna.peran === 'ASISTEN'
        ? '/(asisten)/(tabs)/beranda-asisten'
        : '/(praktikan)/(tabs)/beranda-praktikan';
}
