import { useRouter } from 'expo-router';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BerandaGreeting } from '@/components/shared/beranda-greeting';
import {
  BerandaMenuGrid,
  type BerandaMenuItem,
} from '@/components/shared/beranda-menu-grid';
import {
  PraktikumMendatangCard,
  type PraktikumMendatangItem,
} from '@/components/shared/praktikum-mendatang-card';
import {
  SesiAktifCard,
  SesiAktifKosongCard,
  SesiAktifSkeleton,
} from '@/components/shared/sesi-aktif-card';
import {
  IconAlertCircle,
  IconCalendar,
  IconCheckCircle,
  IconChevronRight,
  IconClipboardCheck,
  IconFileCheck,
  IconFlask,
  IconMap,
  IconMonitor,
} from '@/components/ui/icons';
import { EnterView, PopBadge, PressableScale } from '@/components/ui/motion';
import { Colors, Fonts, Radii, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useIzinAsisten } from '@/hooks/use-izin-asisten';
import { useJadwalAsisten } from '@/hooks/use-jadwal-asisten';
import { useKelasAsisten } from '@/hooks/use-kelas-asisten';
import { useRekapSesi } from '@/hooks/use-rekap-sesi';
import type { Sesi } from '@/types';

function formatRentangWaktuSesi(mulai: Date, selesai?: Date | string | null): string {
  const jamMulai = mulai
    .toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
    .replace(':', '.');
  if (!selesai) {
    return `${jamMulai} WIB`;
  }
  const waktuSelesai = new Date(selesai);
  if (Number.isNaN(waktuSelesai.getTime())) {
    return `${jamMulai} WIB`;
  }
  const jamSelesai = waktuSelesai
    .toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
    .replace(':', '.');
  return `${jamMulai}–${jamSelesai} WIB`;
}

function getHariSingkat(tanggal: Date): string {
  return tanggal
    .toLocaleDateString('id-ID', { weekday: 'short' })
    .replace('.', '');
}

function KartuSesiAktifAsisten({
  sesi,
  namaPraktikum,
  onPressKelola,
}: {
  sesi: Sesi;
  namaPraktikum: string;
  onPressKelola: () => void;
}) {
  const { jumlahHadir, totalPeserta } = useRekapSesi(
    sesi.idSesi,
    sesi.kelasId,
    sesi.statusSesi,
  );

  const sesiData = sesi as unknown as { waktuSelesai?: Date | string };

  return (
    <SesiAktifCard
      namaPraktikum={namaPraktikum}
      judul={sesi.judul}
      lokasi={sesi.lokasi}
      rentangWaktu={formatRentangWaktuSesi(
        new Date(sesi.waktuMulai),
        sesiData.waktuSelesai,
      )}
      infoKananAtas={`${jumlahHadir}/${totalPeserta} hadir`}
      labelTombol="Kelola sesi"
      onPressTombol={onPressKelola}
    />
  );
}

export default function BerandaAsistenScreen() {
  const router = useRouter();
  const { pengguna, loading: authLoading } = useAuth();
  const {
    sesi,
    loading: jadwalLoading,
    muatUlang,
  } = useJadwalAsisten(pengguna?.uid ?? null);
  const { kelas } = useKelasAsisten(pengguna?.uid ?? null, { sertakanArsip: true });
  const { izin } = useIzinAsisten(pengguna?.uid ?? null);

  const sedangMemuat = authLoading || jadwalLoading;

  const kelasById = Object.fromEntries(
    kelas.map((item) => [item.idKelas, item]),
  );

  const sesiAktifList = sesi.filter(
    (item) => !item.diarsipkan && item.statusSesi === 'DIBUKA',
  );

  const jumlahIzinMenunggu = izin.filter(
    (item) => item.statusIzin === 'MENUNGGU',
  ).length;

  const sekarang = new Date();
  const batasSatuMinggu = new Date();
  batasSatuMinggu.setDate(sekarang.getDate() + 7);

  const praktikumMendatangItems: PraktikumMendatangItem[] = sesi
    .filter((item) => {
      if (item.diarsipkan || item.statusSesi !== 'BELUM_DIBUKA') return false;
      const waktu = new Date(item.waktuMulai);
      return waktu >= sekarang && waktu <= batasSatuMinggu;
    })
    .sort((a, b) => new Date(a.waktuMulai).getTime() - new Date(b.waktuMulai).getTime())
    .map((item) => {
      const tanggalMulai = new Date(item.waktuMulai);
      const sesiData = item as unknown as { waktuSelesai?: Date | string };
      return {
        idSesi: item.idSesi,
        hariSingkat: getHariSingkat(tanggalMulai),
        angkaTanggal: tanggalMulai.getDate(),
        judul: item.judul,
        namaPraktikum: kelasById[item.kelasId]?.namaPraktikum,
        rentangWaktu: formatRentangWaktuSesi(tanggalMulai, sesiData.waktuSelesai),
        lokasi: item.lokasi,
      };
    });

  const menuItems: BerandaMenuItem[] = [
    {
      key: 'praktikum',
      label: 'Praktikum',
      bgTint: Colors.light.primarySoft,
      onPress: () => router.push('/(asisten)/kelas'),
      icon: <IconMonitor size={24} color={Colors.light.primary} strokeWidth={2} />,
    },
    {
      key: 'jadwal',
      label: 'Jadwal',
      bgTint: Colors.light.warmSoft,
      onPress: () => router.push('/(asisten)/jadwal-asisten'),
      icon: <IconCalendar size={24} color={Colors.light.warm} strokeWidth={1.9} />,
    },
    {
      key: 'rekap',
      label: 'Rekap',
      bgTint: Colors.light.successSoft,
      onPress: () => router.push('/(asisten)/rekap'),
      icon: <IconClipboardCheck size={24} color={Colors.light.success} strokeWidth={1.9} />,
    },
    {
      key: 'izin',
      label: 'Izin',
      bgTint: Colors.light.accentSoft,
      badge: jumlahIzinMenunggu,
      onPress: () => router.push('/(asisten)/izin-asisten'),
      icon: <IconFileCheck size={24} color={Colors.light.accent} strokeWidth={2} />,
    },
    {
      key: 'peta',
      label: 'Peta',
      bgTint: Colors.light.tealSoft,
      onPress: () => router.push('/(asisten)/maps'),
      icon: <IconMap size={24} color={Colors.light.teal} strokeWidth={1.9} />,
    },
    {
      key: 'lab',
      label: 'Lab',
      bgTint: Colors.light.brandMidSoft,
      onPress: () => router.push('/(asisten)/laboratorium'),
      icon: <IconFlask size={24} color={Colors.light.brandMid} strokeWidth={1.9} />,
    },
  ];

  const adaIzinMenunggu = jumlahIzinMenunggu > 0;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={muatUlang}
          tintColor={Colors.light.primary}
        />
      }
    >
      <EnterView delay={0}>
        <BerandaGreeting nama={pengguna?.nama} fallbackNama="Asisten" />
      </EnterView>

      {/* 1. Kartu Sesi Aktif */}
      <EnterView delay={60}>
        {sedangMemuat ? (
          <SesiAktifSkeleton />
        ) : sesiAktifList.length > 0 ? (
          <View style={styles.activeSessionList}>
            {sesiAktifList.map((item) => (
              <KartuSesiAktifAsisten
                key={item.idSesi}
                sesi={item}
                namaPraktikum={kelasById[item.kelasId]?.namaPraktikum ?? 'Praktikum'}
                onPressKelola={() =>
                  router.push({
                    pathname: '/sesi/[id]',
                    params: { id: item.idSesi },
                  })
                }
              />
            ))}
          </View>
        ) : (
          <SesiAktifKosongCard />
        )}
      </EnterView>

      {/* 2. Banner Status Izin */}
      <EnterView delay={110}>
        <PressableScale
          scaleTo={0.98}
          style={[
            styles.izinBanner,
            adaIzinMenunggu ? styles.izinBannerPending : styles.izinBannerClear,
          ]}
          onPress={() => router.push('/(asisten)/izin-asisten')}
        >
          <PopBadge triggerKey={jumlahIzinMenunggu}>
            <View style={styles.izinIconCircle}>
              {adaIzinMenunggu ? (
                <IconAlertCircle size={19} color={Colors.light.accent} strokeWidth={2.1} />
              ) : (
                <IconCheckCircle size={19} color={Colors.light.success} strokeWidth={2.1} />
              )}
            </View>
          </PopBadge>
          <Text
            style={[
              styles.izinTitle,
              adaIzinMenunggu ? styles.izinTitlePending : styles.izinTitleClear,
            ]}
            numberOfLines={1}
          >
            {adaIzinMenunggu
              ? `${jumlahIzinMenunggu} izin perlu diperiksa`
              : 'Semua izin telah diproses'}
          </Text>
          <IconChevronRight
            size={17}
            color={adaIzinMenunggu ? Colors.light.accent : Colors.light.success}
            strokeWidth={2.2}
          />
        </PressableScale>
      </EnterView>

      {/* 3. Section Menu (Grid 3x2) */}
      <EnterView delay={140}>
        <BerandaMenuGrid items={menuItems} columns={3} />
      </EnterView>

      {/* 4. Section Praktikum Mendatang */}
      <EnterView delay={200}>
        <PraktikumMendatangCard
          items={praktikumMendatangItems}
          onPressItem={(idSesi) =>
            router.push({
              pathname: '/sesi/[id]',
              params: { id: idSesi },
            })
          }
          onPressLihatSemua={() => router.push('/(asisten)/jadwal-asisten')}
        />
      </EnterView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
    gap: 20,
    flexGrow: 1,
  },
  activeSessionList: {
    gap: Spacing.three,
  },
  izinBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.lg,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    ...Shadows.subtle,
  },
  izinBannerPending: {
    backgroundColor: Colors.light.accentSoft,
    borderColor: '#FAD2E3',
  },
  izinBannerClear: {
    backgroundColor: Colors.light.successSoft,
    borderColor: '#CDEEE0',
  },
  izinIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.light.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  izinTitle: {
    flex: 1,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13.5,
    lineHeight: 18,
  },
  izinTitlePending: {
    color: Colors.light.text,
  },
  izinTitleClear: {
    color: Colors.light.success,
  },
});
