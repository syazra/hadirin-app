import { useCallback, useEffect, useState } from 'react';
import type { Laboratorium } from '@/types';
import { ambilLaboratorium, tambahLaboratorium, ubahLaboratorium } from '@/services/laboratorium-service';

type InputLaboratorium = Omit<Laboratorium, 'idLab'>;

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

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void muatData(); }, [muatData]);

  const tambah = async (data: InputLaboratorium) => {
    const hasil = await tambahLaboratorium(data);
    if (hasil.ok) await muatData();
    else setError(hasil.pesan);
    return hasil;
  };

  const ubah = async (id: string, data: InputLaboratorium) => {
    const hasil = await ubahLaboratorium(id, data);
    if (hasil.ok) await muatData();
    else setError(hasil.pesan);
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

  return { daftarLaboratorium, loading, error, muatData, tambah, ubah, ubahStatusAktif };
}
