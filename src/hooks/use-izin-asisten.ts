import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
} from '@react-native-firebase/firestore';

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
  const [namaPraktikanByUid, setNamaPraktikanByUid] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!uid) return;

    let aktif = true;
    let siklus = 0;

    const { db } = getFirebaseServices();
    const unsubscribeIzin: (() => void)[] = [];
    const dataPerKelas = new Map<string, Izin[]>();
    const kelasBelumDimuat = new Set<string>();
    const errorPerKelas = new Map<string, string>();
    const namaPerKelas = new Map<string, Record<string, string>>();

    const qKelas = query(
      collection(db, 'kelas'),
      where('asistenUid', '==', uid),
    );

    const unsubscribeKelas = onSnapshot(
      qKelas,
      (snapshot) => {
        if (!aktif) return;

        const idSiklus = ++siklus;

        unsubscribeIzin.splice(0).forEach((unsubscribe) => unsubscribe());
        dataPerKelas.clear();
        kelasBelumDimuat.clear();
        errorPerKelas.clear();
        namaPerKelas.clear();
        setNamaPraktikanByUid({});

        const kelasIds = snapshot.docs
          .filter((item) => item.data().diarsipkan !== true)
          .map((item) => item.id);

        kelasIds.forEach((kelasId) => kelasBelumDimuat.add(kelasId));

        if (kelasIds.length === 0) {
          setState({ uid, izin: [], loading: false, error: null });
          return;
        }

        setState((sebelumnya) => ({
          uid,
          izin: sebelumnya?.uid === uid ? sebelumnya.izin : [],
          loading: true,
          error: null,
        }));

        const perbaruiState = () => {
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
            error:
              errorPerKelas.size > 0
                ? `${errorPerKelas.size} kelas gagal dimuat. Data kelas lain tetap ditampilkan.`
                : null,
          });
        };

        kelasIds.forEach((kelasId) => {
          // Ambil nama anggota dari setiap kelas yang diampu asisten.
          const qAnggota = query(
            collection(db, 'keanggotaan'),
            where('kelasId', '==', kelasId),
          );

          const unsubscribeAnggota = onSnapshot(qAnggota, (snapshot) => {
            if (!aktif || idSiklus !== siklus) return;

            const namaKelas: Record<string, string> = {};

            snapshot.docs.forEach((item) => {
              const data = item.data();

              if (typeof data.uid === 'string' && typeof data.nama === 'string') {
                namaKelas[data.uid] = data.nama;
              }
            });

            namaPerKelas.set(kelasId, namaKelas);

            setNamaPraktikanByUid(
              Object.assign({}, ...Array.from(namaPerKelas.values())),
            );
          });

          unsubscribeIzin.push(unsubscribeAnggota);

          const unsubscribe = listenIzinKelas(
            kelasId,
            (data) => {
              if (!aktif || idSiklus !== siklus) return;

              dataPerKelas.set(kelasId, data);
              kelasBelumDimuat.delete(kelasId);
              errorPerKelas.delete(kelasId);

              perbaruiState();
            },
            (err) => {
              if (!aktif || idSiklus !== siklus) return;

              kelasBelumDimuat.delete(kelasId);
              errorPerKelas.set(kelasId, err.message);

              perbaruiState();
            },
          );
          unsubscribeIzin.push(unsubscribe);
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
      unsubscribeKelas();
      unsubscribeIzin.forEach((unsubscribe) => unsubscribe());
    };
  }, [uid]);

  if (!uid) return { izin: [], loading: false, error: null, namaPraktikanByUid: {} };

  if (state?.uid !== uid) {
    return { izin: [], loading: true, error: null, namaPraktikanByUid: {} };
  }

  return {
    izin: state.izin,
    loading: state.loading,
    error: state.error,
    namaPraktikanByUid,
  };
}
