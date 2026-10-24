import {
  createContext,
  useCallback,
  useMemo,
  useReducer,
  useRef,
  type PropsWithChildren,
} from 'react';

import { dummyPengguna } from '@/data/dummy-pengguna';
import { dummySesi } from '@/data/dummy-sesi';
import type { AppContextValue, AppState, HasilPresensi, Presensi } from '@/types';
import { bacaPayloadQr } from '@/utils/qr-payload';

type AppAction =
  | { type: 'PILIH_IDENTITAS'; idPengguna: string }
  | { type: 'GANTI_PERAN' }
  | { type: 'BUKA_SESI'; idSesi: string }
  | { type: 'TUTUP_SESI'; idSesi: string }
  | { type: 'CATAT_PRESENSI'; presensi: Presensi };

export function createInitialState(): AppState {
  return {
    pengguna: dummyPengguna.map((pengguna) => ({ ...pengguna })),
    penggunaAktif: null,
    sesi: dummySesi.map((sesi) => ({ ...sesi })),
    presensi: [],
  };
}

function validasiPresensi(state: AppState, idSesi: string, idPengguna: string): HasilPresensi {
  const pengguna = state.pengguna.find((item) => item.idPengguna === idPengguna);
  const sesi = state.sesi.find((item) => item.idSesi === idSesi);

  if (
    !sesi ||
    pengguna?.peran !== 'PRAKTIKAN' ||
    state.penggunaAktif?.peran !== 'PRAKTIKAN' ||
    state.penggunaAktif.idPengguna !== idPengguna
  ) {
    return { ok: false, alasan: 'QR_TIDAK_VALID' };
  }
  if (sesi.statusSesi === 'BELUM_DIBUKA') {
    return { ok: false, alasan: 'BELUM_DIBUKA' };
  }
  if (sesi.statusSesi === 'DITUTUP') {
    return { ok: false, alasan: 'SUDAH_DITUTUP' };
  }
  if (state.presensi.some((item) => item.idSesi === idSesi && item.idPengguna === idPengguna)) {
    return { ok: false, alasan: 'SUDAH_PRESENSI' };
  }
  return { ok: true, alasan: null };
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
    case 'BUKA_SESI':
    case 'TUTUP_SESI': {
      if (state.penggunaAktif?.peran !== 'ASISTEN') return state;

      const sesi = state.sesi.find((item) => item.idSesi === action.idSesi);
      const statusAwal = action.type === 'BUKA_SESI' ? 'BELUM_DIBUKA' : 'DIBUKA';
      const statusAkhir = action.type === 'BUKA_SESI' ? 'DIBUKA' : 'DITUTUP';
      if (!sesi || sesi.statusSesi !== statusAwal) return state;

      return {
        ...state,
        sesi: state.sesi.map((item) => item === sesi ? { ...item, statusSesi: statusAkhir } : item),
      };
    }
    case 'CATAT_PRESENSI': {
      const { idSesi, idPengguna } = action.presensi;
      if (!validasiPresensi(state, idSesi, idPengguna).ok) return state;

      return { ...state, presensi: [...state.presensi, action.presensi] };
    }
    default:
      return state;
  }
}

export const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(appReducer, undefined, createInitialState);
  const stateTerbaru = useRef(state);

  const kirimAksi = useCallback((action: AppAction) => {
    const berikutnya = appReducer(stateTerbaru.current, action);
    if (berikutnya === stateTerbaru.current) return;

    // Validasi panggilan berikutnya memakai aksi yang sudah antre, sebelum render berikutnya.
    stateTerbaru.current = berikutnya;
    dispatch(action);
  }, []);

  const pilihIdentitas = useCallback((idPengguna: string) => {
    kirimAksi({ type: 'PILIH_IDENTITAS', idPengguna });
  }, [kirimAksi]);

  const gantiPeran = useCallback(() => {
    kirimAksi({ type: 'GANTI_PERAN' });
  }, [kirimAksi]);

  const bukaSesi = useCallback((idSesi: string) => {
    kirimAksi({ type: 'BUKA_SESI', idSesi });
  }, [kirimAksi]);

  const tutupSesi = useCallback((idSesi: string) => {
    kirimAksi({ type: 'TUTUP_SESI', idSesi });
  }, [kirimAksi]);

  const catatPresensi = useCallback((idSesi: string, idPengguna: string): HasilPresensi => {
    const hasil = validasiPresensi(stateTerbaru.current, idSesi, idPengguna);
    if (!hasil.ok) return hasil;

    kirimAksi({
      type: 'CATAT_PRESENSI',
      presensi: {
        idPresensi: `presensi:${idSesi}:${idPengguna}`,
        idSesi,
        idPengguna,
        waktuHadir: new Date().toISOString(),
      },
    });
    return hasil;
  }, [kirimAksi]);

  const catatPresensiDariQr = useCallback((payloadQr: string, idPengguna: string): HasilPresensi => {
    // Scanner membandingkan ID sesi layar; aksi ini memvalidasi sesi dalam payload.
    const payload = bacaPayloadQr(payloadQr);
    const sesi = stateTerbaru.current.sesi.find((item) => item.idSesi === payload?.idSesi);
    if (!payload || !sesi || sesi.kodeQr !== payload.kodeQr) {
      return { ok: false, alasan: 'QR_TIDAK_VALID' };
    }
    return catatPresensi(sesi.idSesi, idPengguna);
  }, [catatPresensi]);

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      pilihIdentitas,
      gantiPeran,
      bukaSesi,
      tutupSesi,
      catatPresensi,
      catatPresensiDariQr,
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
    [state, pilihIdentitas, gantiPeran, bukaSesi, tutupSesi, catatPresensi, catatPresensiDariQr],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
