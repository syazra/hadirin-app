import { useCallback, useEffect, useState } from 'react';

import {
    listenAktivitasLaboratorium,
    type RingkasanAktivitasLaboratorium,
} from '@/services/laboratory-activity-service';

interface StateAktivitasLab {
  labId: string;
  retryKey: number;
  data: RingkasanAktivitasLaboratorium;
  loading: boolean;
  error: string | null;
}

const RINGKASAN_KOSONG: RingkasanAktivitasLaboratorium = {
  currentActivities: [],
  nextActivities: [],
};

export interface UseLaboratoryActivitiesResult {
  currentActivities: RingkasanAktivitasLaboratorium['currentActivities'];
  nextActivities: RingkasanAktivitasLaboratorium['nextActivities'];
  loading: boolean;
  error: string | null;
  muatUlang: () => void;
}

export function useLaboratoryActivities(
  labId: string | null | undefined,
): UseLaboratoryActivitiesResult {
  const labIdBersih = typeof labId === 'string' ? labId.trim() : '';
  const [retryKey, setRetryKey] = useState(0);
  const [state, setState] = useState<StateAktivitasLab | null>(null);

  const muatUlang = useCallback(() => {
    setRetryKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!labIdBersih) {
      return;
    }

    const targetLab = labIdBersih;
    const targetRetry = retryKey;

    const unsubscribe = listenAktivitasLaboratorium(
      targetLab,
      (ringkasan) => {
        setState({
          labId: targetLab,
          retryKey: targetRetry,
          data: ringkasan,
          loading: false,
          error: null,
        });
      },
      (err) => {
        setState({
          labId: targetLab,
          retryKey: targetRetry,
          data: RINGKASAN_KOSONG,
          loading: false,
          error:
            err.message ||
            'Gagal memuat jadwal aktivitas laboratorium.',
        });
      },
    );

    return () => {
      unsubscribe();
    };
  }, [labIdBersih, retryKey]);

  if (!labIdBersih) {
    return {
      currentActivities: [],
      nextActivities: [],
      loading: false,
      error: null,
      muatUlang,
    };
  }

  const stateCocok =
    state?.labId === labIdBersih && state.retryKey === retryKey ? state : null;

  return {
    currentActivities: stateCocok?.data.currentActivities ?? [],
    nextActivities: stateCocok?.data.nextActivities ?? [],
    loading: stateCocok?.loading ?? true,
    error: stateCocok?.error ?? null,
    muatUlang,
  };
}