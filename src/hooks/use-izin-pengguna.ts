import { useEffect, useState } from 'react';
import type { Izin } from '@/types';
import { listenIzinPengguna } from '@/services/izin-service';

interface StateIzin {
  uid: string | null;
  izin: Izin[];
  loading: boolean;
  error: string | null;
}

export function useIzinPengguna(uid: string | null | undefined) {
  const [state, setState] = useState<StateIzin>({
    uid: null,
    izin: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!uid) return;

    let aktif = true;

    const unsubscribe = listenIzinPengguna(
      uid,
      (data) => {
        if (!aktif) return;

        setState({
          uid,
          izin: data,
          loading: false,
          error: null,
        });
      },
      (err) => {
        if (!aktif) return;

        setState({
          uid,
          izin: [],
          loading: false,
          error: err.message,
        });
      },
    );

    return () => {
      aktif = false;
      unsubscribe();
    };
  }, [uid]);

  // Jangan tampilkan data akun sebelumnya ketika UID berubah.
  if (!uid) {
    return { izin: [], loading: false, error: null };
  }

  if (state.uid !== uid) {
    return { izin: [], loading: true, error: null };
  }

  return {
    izin: state.izin,
    loading: state.loading,
    error: state.error,
  };
}