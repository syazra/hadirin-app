import { useEffect, useState } from 'react';

import { listenPresensiPengguna } from '@/services/presensi-service';
import { listenSesiById } from '@/services/sesi-service';
import type { Presensi, Sesi } from '@/types';

export type ItemRiwayatKehadiran = {
  sesi: Sesi;
  presensi: Presensi;
};

type StateRiwayat = {
  uid: string;
  riwayat: ItemRiwayatKehadiran[];
  loading: boolean;
  error: string | null;
};

export function useRiwayatKehadiran(uid: string) {
  const [state, setState] = useState<StateRiwayat>({
    uid,
    riwayat: [],
    loading: !!uid,
    error: null,
  });

  useEffect(() => {
    if (!uid) return;

    let aktif = true;
    let siklus = 0;

    const berhentiSesi: (() => void)[] = [];
    const hasilSesi = new Map<string, ItemRiwayatKehadiran>();
    const sesiSelesai = new Set<string>();
    const errorSesi = new Map<string, string>();

    const berhentiPresensi = listenPresensiPengguna(
      uid,
      (daftar) => {
        if (!aktif) return;

        const idSiklus = ++siklus;

        berhentiSesi.splice(0).forEach((berhenti) => berhenti());
        hasilSesi.clear();
        sesiSelesai.clear();
        errorSesi.clear();

        if (daftar.length === 0) {
          setState({
            uid,
            riwayat: [],
            loading: false,
            error: null,
          });
          return;
        }

        setState((sebelumnya) => ({
          uid,
          riwayat: sebelumnya.uid === uid ? sebelumnya.riwayat : [],
          loading: true,
          error: null,
        }));

        const perbaruiState = () => {
          const riwayat = [...hasilSesi.values()].sort(
            (a, b) =>
              (b.presensi.waktuHadir?.getTime() ?? 0) -
              (a.presensi.waktuHadir?.getTime() ?? 0),
          );

          setState({
            uid,
            riwayat,
            loading: sesiSelesai.size < daftar.length,
            error:
              errorSesi.size > 0
                ? `${errorSesi.size} detail sesi gagal dimuat. Riwayat lainnya tetap ditampilkan.`
                : null,
          });
        };

        daftar.forEach((presensi) => {
          const berhenti = listenSesiById(
            presensi.sesiId,
            (sesi) => {
              if (!aktif || idSiklus !== siklus) return;

              if (sesi) {
                hasilSesi.set(presensi.idPresensi, {
                  sesi,
                  presensi,
                });
              } else {
                hasilSesi.delete(presensi.idPresensi);
              }

              sesiSelesai.add(presensi.sesiId);
              errorSesi.delete(presensi.sesiId);

              perbaruiState();
            },
            (kesalahan) => {
              if (!aktif || idSiklus !== siklus) return;

              sesiSelesai.add(presensi.sesiId);
              errorSesi.set(presensi.sesiId, kesalahan.message);

              perbaruiState();
            },
          );

          berhentiSesi.push(berhenti);
        });
      },
      (kesalahan) => {
        if (!aktif) return;

        setState({
          uid,
          riwayat: [],
          loading: false,
          error: kesalahan.message,
        });
      },
    );

    return () => {
      aktif = false;
      berhentiPresensi();
      berhentiSesi.forEach((berhenti) => berhenti());
    };
  }, [uid]);

  if (!uid) {
    return { riwayat: [], loading: false, error: null };
  }

  if (state.uid !== uid) {
    return { riwayat: [], loading: true, error: null };
  }

  return {
    riwayat: state.riwayat,
    loading: state.loading,
    error: state.error,
  };
}
