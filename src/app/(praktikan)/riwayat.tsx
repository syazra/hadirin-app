import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RiwayatItem } from '@/components/praktikan/riwayat-item';
import { LayarPersiapan } from '@/components/shared/layar-persiapan';
import { BrandGradient } from '@/components/ui/brand-gradient';
import {
  DropdownSelect,
  type DropdownOption,
} from '@/components/ui/dropdown-select';
import { EmptyState } from '@/components/ui/empty-state';
import { IconCheckCircle } from '@/components/ui/icons';
import { LoadingState } from '@/components/ui/loading-state';
import { EnterView, PopBadge } from '@/components/ui/motion';
import { getStaggerDelay } from '@/constants/motion';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useRiwayatKehadiran } from '@/hooks/use-riwayat-kehadiran';

const FILTER_SEMUA_MATKUL = 'SEMUA';

export default function RiwayatScreen() {
  const insets = useSafeAreaInsets();
  const { pengguna } = useAuth();
  const { riwayat, loading, error } = useRiwayatKehadiran(pengguna?.uid ?? '');
  const [filterKelasId, setFilterKelasId] = useState<string>(
    FILTER_SEMUA_MATKUL,
  );

  const opsiMataKuliah: DropdownOption[] = useMemo(() => {
    const mapKelas = new Map<string, { nama: string; count: number }>();

    for (const item of riwayat) {
      const id = item.sesi.kelasId || item.presensi.kelasId;
      if (!id) continue;

      const nama =
        item.sesi.namaPraktikum?.trim() || 'Mata Kuliah Tidak Diketahui';
      const existing = mapKelas.get(id);
      if (existing) {
        existing.count += 1;
        if (
          existing.nama === 'Mata Kuliah Tidak Diketahui' &&
          nama !== 'Mata Kuliah Tidak Diketahui'
        ) {
          existing.nama = nama;
        }
      } else {
        mapKelas.set(id, { nama, count: 1 });
      }
    }

    const daftarKelas = Array.from(mapKelas.entries())
      .sort((a, b) => a[1].nama.localeCompare(b[1].nama))
      .map(([id, info]) => ({
        value: id,
        label: info.nama,
        subtitle: `${info.count} sesi hadir`,
      }));

    return [
      {
        value: FILTER_SEMUA_MATKUL,
        label: 'Semua Mata Kuliah',
        subtitle: `${riwayat.length} total sesi hadir`,
      },
      ...daftarKelas,
    ];
  }, [riwayat]);

  const filterKelasAktif = useMemo(() => {
    if (filterKelasId === FILTER_SEMUA_MATKUL) return FILTER_SEMUA_MATKUL;
    return opsiMataKuliah.some((item) => item.value === filterKelasId)
      ? filterKelasId
      : FILTER_SEMUA_MATKUL;
  }, [filterKelasId, opsiMataKuliah]);

  const riwayatTampil = useMemo(() => {
    if (filterKelasAktif === FILTER_SEMUA_MATKUL) return riwayat;
    return riwayat.filter(
      (item) =>
        (item.sesi.kelasId || item.presensi.kelasId) === filterKelasAktif,
    );
  }, [riwayat, filterKelasAktif]);

  const jumlahHadir = riwayatTampil.length;

  if (!pengguna || pengguna.peran !== 'PRAKTIKAN') {
    return (
      <LayarPersiapan
        judul="Riwayat kehadiran"
        pesan="Masuk sebagai praktikan untuk melihat riwayat presensi."
      />
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.container,
        { paddingBottom: 36 + insets.bottom },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {riwayat.length > 0 && (
        <>
          <EnterView scaleFrom={0.97}>
            <BrandGradient
              variant="emerald"
              style={[styles.ringkasan, Shadows.emeraldGlow]}
            >
              <View style={styles.ringkasanLeft}>
                <PopBadge triggerKey={jumlahHadir}>
                  <Text style={styles.ringkasanCount}>{jumlahHadir}</Text>
                </PopBadge>
                <Text style={styles.ringkasanLabel}>
                  {filterKelasAktif === FILTER_SEMUA_MATKUL
                    ? 'Total Sesi Hadir'
                    : 'Sesi Hadir di Mata Kuliah Ini'}
                </Text>
              </View>
              <View style={styles.ringkasanMedallion}>
                <IconCheckCircle size={28} color="#FFFFFF" strokeWidth={2.1} />
              </View>
            </BrandGradient>
          </EnterView>

          <View style={styles.filterCard}>
            <DropdownSelect
              label="Filter Mata Kuliah"
              placeholder="Semua Mata Kuliah"
              sheetTitle="Pilih Mata Kuliah"
              options={opsiMataKuliah}
              selectedValue={filterKelasAktif}
              onSelect={setFilterKelasId}
            />
          </View>
        </>
      )}

      {loading ? (
        <LoadingState pesan="Memuat riwayat presensi..." layarPenuh={false} />
      ) : riwayatTampil.length > 0 ? (
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.daftar}>
            {riwayatTampil.map((item, index) => (
              <EnterView
                key={item.presensi.idPresensi}
                delay={getStaggerDelay(index, 70)}
              >
                <RiwayatItem {...item} />
              </EnterView>
            ))}
          </View>
        </>
      ) : riwayat.length > 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            judul="Tidak ada riwayat pada mata kuliah ini"
            pesan="Pilih mata kuliah lain atau tampilkan semua mata kuliah."
          />
        </View>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <View style={styles.emptyWrap}>
          <EmptyState
            judul="Belum ada catatan kehadiran"
            pesan="Presensi yang kamu lakukan akan muncul di sini."
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    padding: 20,
    paddingTop: 14,
    gap: 16,
    flexGrow: 1,
  },
  ringkasan: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: Radii.xl,
  },
  ringkasanLeft: {
    gap: 2,
  },
  ringkasanCount: {
    fontFamily: Fonts.sansBold,
    fontSize: 34,
    lineHeight: 40,
    color: '#FFFFFF',
  },
  ringkasanLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13.5,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  ringkasanMedallion: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCard: {
    padding: 14,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    ...Shadows.subtle,
  },
  daftar: {
    gap: 12,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  error: {
    fontFamily: Fonts.sansMedium,
    color: Colors.light.danger,
    fontSize: 12.5,
    lineHeight: 18,
  },
});