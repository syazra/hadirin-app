import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KelasCard } from '@/components/asisten/kelas-card';
import {
  KelasFormSheet,
  type NilaiFormKelas,
} from '@/components/asisten/kelas-form-sheet';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { IconPlus } from '@/components/ui/icons';
import { LoadingState } from '@/components/ui/loading-state';
import { EnterView, PressableScale } from '@/components/ui/motion';
import { getStaggerDelay } from '@/constants/motion';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useKelasAsisten } from '@/hooks/use-kelas-asisten';
import { useLaboratorium } from '@/hooks/use-laboratorium';
import {
  arsipkanKelas,
  tambahKelas,
  ubahKelas,
} from '@/services/kelas-service';
import type { Kelas } from '@/types';

type FilterKelas = 'SEMUA' | 'AKTIF' | 'DIARSIPKAN';

export default function KelasScreen() {
  const router = useRouter();
  const { pengguna } = useAuth();
  const { kelas, jumlahPesertaPerKelas, loading, error, cobaLagi } =
    useKelasAsisten(pengguna?.uid ?? null, { sertakanArsip: true });
  const { daftarLaboratorium } = useLaboratorium();

  const [filter, setFilter] = useState<FilterKelas>('SEMUA');

  const [formTerbuka, setFormTerbuka] = useState(false);
  const [kelasDiedit, setKelasDiedit] = useState<Kelas | null>(null);
  const [loadingForm, setLoadingForm] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const [kelasDiarsip, setKelasDiarsip] = useState<Kelas | null>(null);
  const [loadingArsip, setLoadingArsip] = useState(false);

  const laboratoriumAktif = useMemo(
    () => daftarLaboratorium.filter((item) => item.aktif),
    [daftarLaboratorium],
  );

  const labelLabPerId = useMemo(() => {
    const peta: Record<string, string> = {};
    for (const lab of daftarLaboratorium) {
      peta[lab.idLab] = `${lab.kodeLab} · ${lab.nama}`;
    }
    return peta;
  }, [daftarLaboratorium]);

  const { jumlahAktif, jumlahDiarsipkan, kelasTampil } = useMemo(() => {
    const aktif = kelas.filter((item) => !item.diarsipkan);
    const diarsipkan = kelas.filter((item) => item.diarsipkan);

    const hasilFilter =
      filter === 'AKTIF'
        ? aktif
        : filter === 'DIARSIPKAN'
          ? diarsipkan
          : [...aktif, ...diarsipkan];

    return {
      jumlahAktif: aktif.length,
      jumlahDiarsipkan: diarsipkan.length,
      kelasTampil: hasilFilter,
    };
  }, [kelas, filter]);

  const opsiFilter: { key: FilterKelas; label: string; jumlah: number }[] = [
    { key: 'SEMUA', label: 'Semua', jumlah: kelas.length },
    { key: 'AKTIF', label: 'Aktif', jumlah: jumlahAktif },
    { key: 'DIARSIPKAN', label: 'Arsip', jumlah: jumlahDiarsipkan },
  ];

  const bukaFormTambah = () => {
    setKelasDiedit(null);
    setErrorForm(null);
    setFormTerbuka(true);
  };

  const bukaFormEdit = (item: Kelas) => {
    setKelasDiedit(item);
    setErrorForm(null);
    setFormTerbuka(true);
  };

  const tutupForm = () => {
    if (loadingForm) return;
    setFormTerbuka(false);
    setKelasDiedit(null);
    setErrorForm(null);
  };

  const handleSubmitForm = async (nilai: NilaiFormKelas) => {
    setLoadingForm(true);
    setErrorForm(null);

    const hasil = kelasDiedit
      ? await ubahKelas(kelasDiedit.idKelas, {
          namaPraktikum: nilai.namaPraktikum,
          labId: nilai.labId,
          gracePeriodMenit: nilai.gracePeriodMenit,
          nominalDenda: nilai.nominalDenda,
        })
      : await tambahKelas(nilai.namaPraktikum, {
          labId: nilai.labId,
          gracePeriodMenit: nilai.gracePeriodMenit,
          nominalDenda: nilai.nominalDenda,
        });

    setLoadingForm(false);

    if (!hasil.ok) {
      setErrorForm(hasil.pesan);
      return;
    }

    setFormTerbuka(false);
    setKelasDiedit(null);
  };

  const handleKonfirmasiArsip = async () => {
    if (!kelasDiarsip || loadingArsip) return;

    setLoadingArsip(true);
    const hasil = await arsipkanKelas(kelasDiarsip.idKelas);
    setLoadingArsip(false);

    if (!hasil.ok) {
      Alert.alert('Gagal mengarsipkan kelas', hasil.pesan);
      return;
    }

    setKelasDiarsip(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <LoadingState pesan="Memuat daftar kelas..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ErrorState pesan={error} onCobaLagi={cobaLagi} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Top control bar: scrollable filter pills + compact "+ Praktikum" CTA */}
      <View style={styles.topBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}
        >
          {opsiFilter.map((opsi) => {
            const aktif = filter === opsi.key;
            return (
              <PressableScale
                key={opsi.key}
                onPress={() => setFilter(opsi.key)}
                scaleTo={0.94}
                accessibilityRole="button"
                accessibilityState={{ selected: aktif }}
                style={[
                  styles.filterChip,
                  aktif && styles.filterChipAktif,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipTeks,
                    aktif && styles.filterChipTeksAktif,
                  ]}
                >
                  {opsi.label}
                </Text>
                <View
                  style={[
                    styles.filterBadge,
                    aktif && styles.filterBadgeAktif,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterBadgeTeks,
                      aktif && styles.filterBadgeTeksAktif,
                    ]}
                  >
                    {opsi.jumlah}
                  </Text>
                </View>
              </PressableScale>
            );
          })}
        </ScrollView>

        <PressableScale
          onPress={bukaFormTambah}
          scaleTo={0.94}
          accessibilityRole="button"
          accessibilityLabel="Tambah Praktikum"
          style={styles.tombolTambah}
        >
          <IconPlus size={16} color="#FFFFFF" strokeWidth={2.4} />
          <Text style={styles.tombolTambahTeks}>Praktikum</Text>
        </PressableScale>
      </View>

      {kelas.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            judul="Belum ada kelas"
            pesan="Buat kelas praktikum pertama untuk mulai mengelola praktikan dan sesi."
          />
        </View>
      ) : kelasTampil.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            judul={
              filter === 'DIARSIPKAN'
                ? 'Belum ada kelas diarsipkan'
                : 'Belum ada kelas aktif'
            }
            pesan="Pilih filter lain di atas untuk melihat daftar kelas."
          />
        </View>
      ) : (
        <FlatList
          data={kelasTampil}
          keyExtractor={(item) => item.idKelas}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <EnterView delay={getStaggerDelay(index)}>
              <KelasCard
                kelas={item}
                labelLab={item.labId ? labelLabPerId[item.labId] : undefined}
                jumlahPeserta={jumlahPesertaPerKelas[item.idKelas]}
                onPress={() =>
                  router.push({
                    pathname: '/kelas/[id]',
                    params: { id: item.idKelas },
                  })
                }
                onEdit={() => bukaFormEdit(item)}
                onArsip={() => setKelasDiarsip(item)}
              />
            </EnterView>
          )}
        />
      )}

      <KelasFormSheet
        visible={formTerbuka}
        mode={kelasDiedit ? 'ubah' : 'tambah'}
        kelasAwal={kelasDiedit}
        daftarLab={laboratoriumAktif}
        loading={loadingForm}
        errorPesan={errorForm}
        onSubmit={handleSubmitForm}
        onTutup={tutupForm}
      />

      <ConfirmSheet
        visible={kelasDiarsip !== null}
        judul="Arsipkan kelas?"
        pesan={
          kelasDiarsip
            ? `Kelas "${kelasDiarsip.namaPraktikum}" akan diarsipkan. Riwayat tetap tersimpan, tetapi praktikan dan sesi baru tidak dapat ditambahkan.`
            : ''
        }
        labelKonfirmasi="Arsipkan"
        labelLoading="Mengarsipkan…"
        loading={loadingArsip}
        destructive
        onKonfirmasi={handleKonfirmasiArsip}
        onBatal={() => {
          if (!loadingArsip) setKelasDiarsip(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
  },
  filterScroll: {
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
    paddingRight: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.subtle,
  },
  filterChipAktif: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterChipTeks: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12.5,
    color: Colors.light.text,
  },
  filterChipTeksAktif: {
    color: '#FFFFFF',
  },
  filterBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: Radii.pill,
    backgroundColor: Colors.light.backgroundElement,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeAktif: {
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
  },
  filterBadgeTeks: {
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  filterBadgeTeksAktif: {
    color: '#FFFFFF',
  },
  tombolTambah: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: Radii.md,
    backgroundColor: Colors.light.primary,
    ...Shadows.primaryGlow,
  },
  tombolTambahTeks: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13.5,
    color: '#FFFFFF',
  },
  emptyWrap: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 28,
    gap: 14,
  },
});