import type { Pengguna } from '@/types';

export type TujuanNavigasiAuth =
    | '/(auth)/login'
    | '/(asisten)/jadwal-asisten'
    | '/(praktikan)/jadwal-praktikan';

export function tentukanTujuanNavigasiAuth(state: {
    pengguna: Pengguna | null;
    loading: boolean;
    profilBelumLengkap: boolean;
}): TujuanNavigasiAuth | null {
    if (state.loading) return null;
    if (!state.pengguna || state.profilBelumLengkap) return '/(auth)/login';

    return state.pengguna.peran === 'ASISTEN'
        ? '/(asisten)/jadwal-asisten'
        : '/(praktikan)/jadwal-praktikan';
}
