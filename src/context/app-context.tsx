import {
  createContext,
  useCallback,
  useMemo,
  useReducer,
  type PropsWithChildren,
} from 'react';

import { dummyPengguna } from '@/data/dummy-pengguna';
import { dummySesi } from '@/data/dummy-sesi';
import type { AppContextValue, AppState } from '@/types';

type AppAction =
  | { type: 'PILIH_IDENTITAS'; idPengguna: string }
  | { type: 'GANTI_PERAN' };

export function createInitialState(): AppState {
  return {
    pengguna: dummyPengguna.map((pengguna) => ({ ...pengguna })),
    penggunaAktif: null,
    sesi: dummySesi.map((sesi) => ({ ...sesi })),
    presensi: [],
  };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'PILIH_IDENTITAS': {
      const penggunaAktif = state.pengguna.find(
        (pengguna) => pengguna.idPengguna === action.idPengguna,
      );
      return penggunaAktif ? { ...state, penggunaAktif } : state;
    }
    case 'GANTI_PERAN':
      // Hanya identitas yang dihapus; data sesi dan presensi tetap hidup.
      return { ...state, penggunaAktif: null };
    default:
      return state;
  }
}

// Stub tidak boleh mengaku sukses atau mencatat presensi sebelum Tahap 1a.
function belumDiimplementasikan(aksi: string): never {
  throw new Error(`${aksi} belum tersedia. Lengkapi aksi pada Tahap 1a.`);
}

export const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(appReducer, undefined, createInitialState);

  const pilihIdentitas = useCallback((idPengguna: string) => {
    dispatch({ type: 'PILIH_IDENTITAS', idPengguna });
  }, []);

  const gantiPeran = useCallback(() => {
    dispatch({ type: 'GANTI_PERAN' });
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      pilihIdentitas,
      gantiPeran,
      bukaSesi: (idSesi) => belumDiimplementasikan(`bukaSesi(${idSesi})`),
      tutupSesi: (idSesi) => belumDiimplementasikan(`tutupSesi(${idSesi})`),
      catatPresensi: (idSesi, idPengguna) =>
        belumDiimplementasikan(`catatPresensi(${idSesi}, ${idPengguna})`),
      catatPresensiDariQr: () => belumDiimplementasikan('catatPresensiDariQr'),
      getSesiById: (id) => state.sesi.find((sesi) => sesi.idSesi === id),
      getPresensiBySesi: (id) =>
        state.presensi.filter((presensi) => presensi.idSesi === id),
      getRiwayatPengguna: (idPengguna) =>
        state.presensi.filter((presensi) => presensi.idPengguna === idPengguna),
      sudahPresensi: (idSesi, idPengguna) =>
        state.presensi.some(
          (presensi) =>
            presensi.idSesi === idSesi && presensi.idPengguna === idPengguna,
        ),
    }),
    [state, pilihIdentitas, gantiPeran],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
