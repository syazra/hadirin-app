import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from '@react-native-firebase/firestore';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
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
  IconClipboardCheck,
  IconFileCheck,
  IconMap,
  IconMonitor,
} from '@/components/ui/icons';
import { EnterView } from '@/components/ui/motion';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useJadwalPraktikan } from '@/hooks/use-jadwal-praktikan';
import { getFirebaseServices } from '@/lib/firebase';

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

export default function BerandaPraktikanScreen() {
  const router = useRouter();
  const { pengguna, loading: authLoading } = useAuth();
  const {
    sesi,
    loading: jadwalLoading,
    muatUlang,
  } = useJadwalPraktikan(pengguna?.uid ?? null);

  const [cacheNamaKelas, setCacheNamaKelas] = useState<{
    uid: string;
    map: Record<string, string>;
  } | null>(null);

  useEffect(() => {
    const uid = pengguna?.uid;
    const unikKelasIds = Array.from(
      new Set(sesi.map((item) => item.kelasId).filter(Boolean)),
    );

    if (!uid || unikKelasIds.length === 0) {
      return;
    }

    let aktif = true;
    const { db } = getFirebaseServices();

    async function muatNamaKelas(userUid: string) {
      const hasilMap: Record<string, string> = {};

      try {
        const qKeanggotaan = query(
          collection(db, 'keanggotaan'),
          where('uid', '==', userUid),
        );
        const snapAnggota = await getDocs(qKeanggotaan);
        snapAnggota.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const idKelas =
            typeof data.kelasId === 'string' ? data.kelasId : '';
          const nama =
            typeof data.namaPraktikum === 'string'
              ? data.namaPraktikum
              : typeof data.namaKelas === 'string'
                ? data.namaKelas
                : '';
          if (idKelas && nama) {
            hasilMap[idKelas] = nama;
          }
        });
      } catch {
        // Lanjut ke pembacaan dokumen kelas langsung
      }

      const sisaKelasIds = unikKelasIds.filter((id) => !hasilMap[id]);
      if (sisaKelasIds.length > 0) {
        await Promise.all(
          sisaKelasIds.map(async (kelasId) => {
            try {
              const kelasSnap = await getDoc(doc(db, 'kelas', kelasId));
              if (kelasSnap.exists()) {
                const data = kelasSnap.data();
                const nama =
                  typeof data?.namaPraktikum === 'string'
                    ? data.namaPraktikum
                    : typeof data?.namaKelas === 'string'
                      ? data.namaKelas
                      : typeof data?.nama === 'string'
                        ? data.nama
                        : '';
                if (nama) {
                  hasilMap[kelasId] = nama;
                }
              }
            } catch {
              // Abaikan jika satu dokumen gagal dibaca
            }
          }),
        );
      }

      if (aktif) {
        setCacheNamaKelas({ uid: userUid, map: hasilMap });
      }
    }

    void muatNamaKelas(uid);

    return () => {
      aktif = false;
    };
  }, [pengguna?.uid, sesi]);

  const namaKelasById =
    pengguna?.uid && cacheNamaKelas?.uid === pengguna.uid
      ? cacheNamaKelas.map
      : {};

  const sedangMemuat = authLoading || jadwalLoading;

  const sesiAktifList = sesi.filter(
    (item) => !item.diarsipkan && item.statusSesi === 'DIBUKA',
  );

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
      const sesiData = item as unknown as {
        waktuSelesai?: Date | string;
        namaPraktikum?: string;
      };
      return {
        idSesi: item.idSesi,
        hariSingkat: getHariSingkat(tanggalMulai),
        angkaTanggal: tanggalMulai.getDate(),
        judul: item.judul,
        namaPraktikum: namaKelasById[item.kelasId] ?? sesiData.namaPraktikum,
        rentangWaktu: formatRentangWaktuSesi(tanggalMulai, sesiData.waktuSelesai),
        lokasi: item.lokasi,
      };
    });

  const menuItems: BerandaMenuItem[] = [
    {
      key: 'praktikum',
      label: 'Praktikum',
      bgTint: Colors.light.primarySoft,
      onPress: () => router.push('/(praktikan)/jadwal-praktikan'),
      icon: <IconMonitor size={23} color={Colors.light.primary} strokeWidth={2} />,
    },
    {
      key: 'riwayat',
      label: 'Riwayat',
      bgTint: Colors.light.successSoft,
      onPress: () => router.push('/(praktikan)/riwayat'),
      icon: <IconClipboardCheck size={23} color={Colors.light.success} strokeWidth={1.9} />,
    },
    {
      key: 'izin',
      label: 'Izin',
      bgTint: Colors.light.accentSoft,
      onPress: () => router.push('/(praktikan)/izin-praktikan'),
      icon: <IconFileCheck size={23} color={Colors.light.accent} strokeWidth={2} />,
    },
    {
      key: 'peta',
      label: 'Peta',
      bgTint: Colors.light.tealSoft,
      onPress: () => router.push('/(praktikan)/maps'),
      icon: <IconMap size={23} color={Colors.light.teal} strokeWidth={1.9} />,
    },
  ];

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
        <BerandaGreeting nama={pengguna?.nama} fallbackNama="Praktikan" />
      </EnterView>

      {/* 1. Kartu Sesi Aktif */}
      <EnterView delay={60}>
        {sedangMemuat ? (
          <SesiAktifSkeleton />
        ) : sesiAktifList.length > 0 ? (
          <View style={styles.activeSessionList}>
            {sesiAktifList.map((item) => {
              const sesiData = item as unknown as {
                waktuSelesai?: Date | string;
                namaPraktikum?: string;
              };
              const namaPraktikum =
                namaKelasById[item.kelasId] ?? sesiData.namaPraktikum ?? 'Praktikum';

              return (
                <SesiAktifCard
                  key={item.idSesi}
                  namaPraktikum={namaPraktikum}
                  judul={item.judul}
                  lokasi={item.lokasi}
                  rentangWaktu={formatRentangWaktuSesi(
                    new Date(item.waktuMulai),
                    sesiData.waktuSelesai,
                  )}
                  labelTombol="Detail sesi"
                  onPressTombol={() =>
                    router.push({
                      pathname: '/sesi/[id]',
                      params: { id: item.idSesi },
                    })
                  }
                />
              );
            })}
          </View>
        ) : (
          <SesiAktifKosongCard />
        )}
      </EnterView>

      {/* 2. Section Menu (4 Fitur) */}
      <EnterView delay={140}>
        <BerandaMenuGrid items={menuItems} columns={4} />
      </EnterView>

      {/* 3. Section Praktikum Mendatang */}
      <EnterView delay={200}>
        <PraktikumMendatangCard
          items={praktikumMendatangItems}
          onPressItem={(idSesi) =>
            router.push({
              pathname: '/sesi/[id]',
              params: { id: idSesi },
            })
          }
          onPressLihatSemua={() => router.push('/(praktikan)/jadwal-praktikan')}
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
});
