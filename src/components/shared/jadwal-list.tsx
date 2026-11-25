import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { SesiCard } from '@/components/shared/sesi-card';
import { EmptyState } from '@/components/ui/empty-state';
import { EnterView, PressableScale } from '@/components/ui/motion';
import { getStaggerDelay } from '@/constants/motion';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';
import type { Sesi, StatusSesi } from '@/types';

type FilterJadwal = 'SEMUA' | StatusSesi;

type JadwalListProps = {
  sesi: Sesi[];
  onPilihSesi: (idSesi: string) => void;
};

export function JadwalList({ sesi, onPilihSesi }: JadwalListProps) {
  const [filter, setFilter] = useState<FilterJadwal>('SEMUA');

  const counts = useMemo(() => {
    let dibuka = 0;
    let belumDibuka = 0;
    let ditutup = 0;

    for (const item of sesi) {
      if (item.statusSesi === 'DIBUKA') dibuka += 1;
      else if (item.statusSesi === 'BELUM_DIBUKA') belumDibuka += 1;
      else if (item.statusSesi === 'DITUTUP') ditutup += 1;
    }

    return {
      SEMUA: sesi.length,
      DIBUKA: dibuka,
      BELUM_DIBUKA: belumDibuka,
      DITUTUP: ditutup,
    };
  }, [sesi]);

  const sesiTampil = useMemo(() => {
    if (filter === 'SEMUA') return sesi;
    return sesi.filter((item) => item.statusSesi === filter);
  }, [sesi, filter]);

  if (sesi.length === 0) {
    return (
      <EmptyState
        judul="Belum ada jadwal"
        pesan="Jadwal praktikum akan muncul di sini saat tersedia."
        emoji="📅"
      />
    );
  }

  const opsiFilter: { key: FilterJadwal; label: string; count: number }[] = [
    { key: 'SEMUA', label: 'Semua', count: counts.SEMUA },
    { key: 'DIBUKA', label: 'Dibuka', count: counts.DIBUKA },
    { key: 'BELUM_DIBUKA', label: 'Mendatang', count: counts.BELUM_DIBUKA },
    { key: 'DITUTUP', label: 'Ditutup', count: counts.DITUTUP },
  ];

  return (
    <View style={styles.wrapper}>
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

      {sesiTampil.length === 0 ? (
        <EmptyState
          judul="Tidak ada sesi"
          pesan="Pilih filter status lain untuk melihat jadwal."
          emoji="📅"
        />
      ) : (
        <View style={styles.list}>
          {sesiTampil.map((item, index) => (
            <EnterView
              key={item.idSesi}
              delay={getStaggerDelay(index)}
              animateLayout
            >
              <SesiCard
                sesi={item}
                namaPraktikum={item.namaPraktikum}
                onPress={() => onPilihSesi(item.idSesi)}
              />
            </EnterView>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 14,
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
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
  },
  filterBadgeText: {
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  filterBadgeTextAktif: {
    color: '#FFFFFF',
  },
  list: {
    gap: 12,
  },
});
