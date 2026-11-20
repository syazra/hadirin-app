import { useCallback, useEffect, useRef, useState } from 'react';

import {
  ambilPosisiSekarang,
  mulaiPantauLokasi,
  pastikanIzinDanLayananLokasi,
} from '@/services/location-service';
import type {
  KoordinatPengguna,
  OpsiLokasiPengguna,
  StateLokasiPengguna,
} from '@/types/location';

const DEFAULT_BATAS_AKURASI_METER = 50;
const DEFAULT_BATAS_USIA_MS = 30_000;
const TIMEOUT_REFRESH_GPS_MS = 10_000;

export interface HasilUseUserLocation extends StateLokasiPengguna {
  refresh: () => Promise<void>;
}

function hitungStatePosisi(
  posisi: KoordinatPengguna,
  batasAkurasiMeter: number,
  batasUsiaMs: number,
): StateLokasiPengguna {
  const waktuValid =
    typeof posisi.timestamp === 'number' && posisi.timestamp > 0
      ? posisi.timestamp
      : Date.now();

  return {
    loading: false,
    permissionDenied: false,
    servicesDisabled: false,
    position: {
      ...posisi,
      timestamp: waktuValid,
    },
    isLowAccuracy:
      posisi.accuracy === null || posisi.accuracy > batasAkurasiMeter,
    isStale: Date.now() - waktuValid > batasUsiaMs,
    error: null,
  };
}

export function useUserLocation(
  opsi: OpsiLokasiPengguna = {},
): HasilUseUserLocation {
  const {
    watch = true,
    batasAkurasiMeter = DEFAULT_BATAS_AKURASI_METER,
    batasUsiaMs = DEFAULT_BATAS_USIA_MS,
  } = opsi;

  const [state, setState] = useState<StateLokasiPengguna>({
    loading: true,
    permissionDenied: false,
    servicesDisabled: false,
    position: null,
    isLowAccuracy: false,
    isStale: false,
    error: null,
  });

  const sedangRefreshRef = useRef(false);

  useEffect(() => {
    let aktif = true;
    let stopWatch: (() => void) | null = null;

    (async () => {
      const kesiapan = await pastikanIzinDanLayananLokasi();
      if (!aktif) return;

      if (!kesiapan.siap) {
        setState({
          loading: false,
          permissionDenied: kesiapan.permissionDenied,
          servicesDisabled: kesiapan.servicesDisabled,
          position: null,
          isLowAccuracy: false,
          isStale: false,
          error: kesiapan.pesan,
        });
        return;
      }

      try {
        const posisiAwal = await ambilPosisiSekarang();
        if (aktif) {
          setState(
            hitungStatePosisi(posisiAwal, batasAkurasiMeter, batasUsiaMs),
          );
        }
      } catch {
        if (aktif) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error:
              'Tidak dapat memperoleh titik koordinat GPS. Pastikan berada di area terbuka dan coba lagi.',
          }));
        }
      }

      if (watch && aktif) {
        try {
          const unsub = await mulaiPantauLokasi((posisiBaru) => {
            if (aktif && !sedangRefreshRef.current) {
              setState(
                hitungStatePosisi(posisiBaru, batasAkurasiMeter, batasUsiaMs),
              );
            }
          });

          if (!aktif) {
            unsub();
          } else {
            stopWatch = unsub;
          }
        } catch {
          // Pertahankan posisiAwal jika watch gagal
        }
      }
    })();

    return () => {
      aktif = false;
      if (stopWatch) {
        stopWatch();
      }
    };
  }, [watch, batasAkurasiMeter, batasUsiaMs]);

  const refresh = useCallback(async () => {
    if (sedangRefreshRef.current) return;
    sedangRefreshRef.current = true;

    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const kesiapan = await pastikanIzinDanLayananLokasi();
      if (!kesiapan.siap) {
        setState({
          loading: false,
          permissionDenied: kesiapan.permissionDenied,
          servicesDisabled: kesiapan.servicesDisabled,
          position: null,
          isLowAccuracy: false,
          isStale: false,
          error: kesiapan.pesan,
        });
        return;
      }

      const posisiBaru = await Promise.race([
        ambilPosisiSekarang(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), TIMEOUT_REFRESH_GPS_MS),
        ),
      ]);

      setState(
        hitungStatePosisi(
          { ...posisiBaru, timestamp: Date.now() },
          batasAkurasiMeter,
          batasUsiaMs,
        ),
      );
    } catch {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: prev.position
          ? null
          : 'Tidak dapat memperoleh titik koordinat GPS. Pastikan berada di area terbuka dan coba lagi.',
      }));
    } finally {
      sedangRefreshRef.current = false;
    }
  }, [batasAkurasiMeter, batasUsiaMs]);

  return {
    ...state,
    refresh,
  };
}