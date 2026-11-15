import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from '@react-native-firebase/firestore';

import { getFirebaseServices } from '@/lib/firebase';
import { listenIzinKelas } from '@/services/izin-service';
import type { Izin } from '@/types';

interface StateIzinAsisten {
  uid: string;
  izin: Izin[];
  loading: boolean;
  error: string | null;
}

export function useIzinAsisten(uid: string | null | undefined) {
  const [state, setState] = useState<StateIzinAsisten | null>(null);

  useEffect(() => {
    if (!uid) return;

    let aktif = true;
    const { db } = getFirebaseServices();
    const unsubscribeIzin: (() => void)[] = [];
    const dataPerKelas = new Map<string, Izin[]>();
    const kelasBelumDimuat = new Set<string>();

    const qKelas = query(collection(db, 'kelas'), where('asistenUid', '==', uid));

    const unsubscribeKelas = onSnapshot(
      qKelas,
      (snapshot) => {
        if (!aktif) return;

        unsubscribeIzin.splice(0).forEach((unsubscribe) => unsubscribe());
        dataPerKelas.clear();

        const kelasIds = snapshot.docs
          .filter((item) => item.data().diarsipkan !== true)
          .map((item) => item.id);

        kelasBelumDimuat.clear();
        kelasIds.forEach((kelasId) => kelasBelumDimuat.add(kelasId));

        if (kelasIds.length === 0) {
          setState({ uid, izin: [], loading: false, error: null });
          return;
        }

        kelasIds.forEach((kelasId) => {
          const unsubscribe = listenIzinKelas(
            kelasId,
            (data) => {
              if (!aktif) return;

              dataPerKelas.set(kelasId, data);
              kelasBelumDimuat.delete(kelasId);

              const semuaIzin = Array.from(dataPerKelas.values())
                .flat()
                .sort(
                  (a, b) =>
                    (b.dibuatPada?.getTime() ?? 0) -
                    (a.dibuatPada?.getTime() ?? 0),
                );

              setState({
                uid,
                izin: semuaIzin,
                loading: kelasBelumDimuat.size > 0,
                error: null,
              });
            },
            (err) => {
              if (!aktif) return;
              setState((sebelumnya) => ({
                uid,
                izin: sebelumnya?.uid === uid ? sebelumnya.izin : [],
                loading: false,
                error: err.message,
              }));
            },
          );

          unsubscribeIzin.push(unsubscribe);
        });
      },
      (err) => {
        if (!aktif) return;
        setState({ uid, izin: [], loading: false, error: err.message });
      },
    );

    return () => {
      aktif = false;
      unsubscribeKelas();
      unsubscribeIzin.forEach((unsubscribe) => unsubscribe());
    };
  }, [uid]);

  if (!uid) return { izin: [], loading: false, error: null };

  if (state?.uid !== uid) {
    return { izin: [], loading: true, error: null };
  }

  return { izin: state.izin, loading: state.loading, error: state.error };
}