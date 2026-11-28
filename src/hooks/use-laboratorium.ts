import { useCallback, useEffect, useState } from 'react';

import {
  ambilLaboratorium,
  hapusLaboratorium,
  tambahLaboratorium,
  ubahLaboratorium,
  type InputLab,
} from '@/services/laboratorium-service';
import type { Laboratorium } from '@/types';

export function useLaboratorium() {
  const [daftarLaboratorium, setDaftarLaboratorium] = useState<Laboratorium[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const muatData = useCallback(async () => {
    setLoading(true);
    const hasil = await ambilLaboratorium();
    if (hasil.ok) {
      setDaftarLaboratorium(hasil.data);
      setError(null);
    } else {
      setError(hasil.pesan);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let aktif = true;

    const ambilAwal = async () => {
      const hasil = await ambilLaboratorium();
      if (!aktif) return;
      if (hasil.ok) {
        setDaftarLaboratorium(hasil.data);
        setError(null);
      } else {
        setError(hasil.pesan);
      }
      setLoading(false);
    };

    void ambilAwal();

    return () => {
      aktif = false;
    };
  }, []);

  const tambah = async (data: InputLab) => {
    const hasil = await tambahLaboratorium(data);
    if (hasil.ok) await muatData();
    return hasil;
  };

  const ubah = async (id: string, data: InputLab) => {
    const hasil = await ubahLaboratorium(id, data);
    if (hasil.ok) await muatData();
    return hasil;
  };

  const hapus = async (id: string) => {
    const hasil = await hapusLaboratorium(id);
    if (hasil.ok) await muatData();
    return hasil;
  };

  const ubahStatusAktif = async (lab: Laboratorium, aktif: boolean) => {
    return ubah(lab.idLab, {
      kodeLab: lab.kodeLab,
      nama: lab.nama,
      lokasiGedung: lab.lokasiGedung,
      latitude: lab.latitude,
      longitude: lab.longitude,
      radiusPresensi: lab.radiusPresensi,
      aktif,
    });
  };

  return {
    daftarLaboratorium,
    loading,
    error,
    muatData,
    tambah,
    ubah,
    hapus,
    ubahStatusAktif,
  };
}