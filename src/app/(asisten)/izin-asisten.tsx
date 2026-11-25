import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { IzinAsistenItem } from '@/components/asisten/izin-asisten-item';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { IconAlertCircle } from '@/components/ui/icons';
import { LoadingState } from '@/components/ui/loading-state';
import { EnterView, PressableScale } from '@/components/ui/motion';
import { getStaggerDelay } from '@/constants/motion';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useIzinAsisten } from '@/hooks/use-izin-asisten';
import type { StatusIzin } from '@/types';

type FilterIzin = 'SEMUA' | StatusIzin;

export default function IzinAsistenScreen() {
  const router = useRouter();
  const { pengguna } = useAuth();
  const { izin, loading, error, namaPraktikanByUid } = useIzinAsisten(
    pengguna?.uid ?? null,
  );
  const [filter, setFilter] = useState<FilterIzin>('SEMUA');

  const counts = useMemo(() => {
    let menunggu = 0;
    let disetujui = 0;
    let ditolak = 0;

    for (const item of izin) {
      if (item.statusIzin === 'MENUNGGU') menunggu += 1;
      else if (item.statusIzin === 'DISETUJUI') disetujui += 1;
      else if (item.statusIzin === 'DITOLAK') ditolak += 1;
    }

    return {
      SEMUA: izin.length,
      MENUNGGU: menunggu,
      DISETUJUI: disetujui,
      DITOLAK: ditolak,
    };
  }, [izin]);

  const izinTampil = useMemo(() => {
    if (filter === 'SEMUA') return izin;
    return izin.filter((item) => item.statusIzin === filter);
  }, [izin, filter]);

  if (loading && izin.length === 0) {
    return <LoadingState pesan="Memuat pengajuan izin..." />;
  }

  if (error && izin.length === 0) {
    return <ErrorState judul="Gagal memuat pengajuan izin" pesan={error} />;
  }

  const opsiFilter: { key: FilterIzin; label: string; count: number }[] = [
    { key: 'SEMUA', label: 'Semua', count: counts.SEMUA },
    { key: 'MENUNGGU', label: 'Menunggu', count: counts.MENUNGGU },
    { key: 'DISETUJUI', label: 'Disetujui', count: counts.DISETUJUI },
    { key: 'DITOLAK', label: 'Ditolak', count: counts.DITOLAK },
  ];

  return (
    <View style={styles.screen}>
      <View style={styles.filterWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
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
                    styles.filterText,
                    aktif && styles.filterTextAktif,
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
                      styles.filterBadgeText,
                      aktif && styles.filterBadgeTextAktif,
                    ]}
                  >
                    {opsi.count}
                  </Text>
                </View>
              </PressableScale>
            );
          })}
        </ScrollView>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <IconAlertCircle size={15} color={Colors.light.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {izin.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            judul="Belum ada pengajuan izin"
            pesan="Pengajuan izin dari praktikan akan muncul di sini."
          />
        </View>
      ) : izinTampil.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            judul="Tidak ada pengajuan"
            pesan="Pilih filter status lain untuk melihat pengajuan."
          />
        </View>
      ) : (
        <FlatList
          data={izinTampil}
          keyExtractor={(item) => item.idIzin}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <EnterView delay={getStaggerDelay(index)}>
              <IzinAsistenItem
                izin={item}
                namaPraktikan={namaPraktikanByUid[item.uid]}
                onPress={() =>
                  router.push({ pathname: '/izin/[id]', params: { id: item.idIzin } })
                }
              />
            </EnterView>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  filterWrap: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  filterText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12.5,
    color: Colors.light.text,
  },
  filterTextAktif: {
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
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  filterBadgeText: {
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  filterBadgeTextAktif: {
    color: '#FFFFFF',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: Radii.md,
    backgroundColor: Colors.light.dangerSoft,
  },
  errorText: {
    flex: 1,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.light.danger,
  },
  emptyWrap: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 28,
    gap: 12,
  },
});
