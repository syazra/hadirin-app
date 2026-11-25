import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { DetailIzinAsisten } from '@/components/asisten/detail-izin-asisten';
import { KategoriAiBadge } from '@/components/praktikan/kategori-ai-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import {
  IconCheckCircle,
  IconClock,
  IconSparkles,
  IconXCircle,
} from '@/components/ui/icons';
import { LoadingState } from '@/components/ui/loading-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { Colors, Fonts, Radii, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useIzinAsisten } from '@/hooks/use-izin-asisten';
import { useIzinPengguna } from '@/hooks/use-izin-pengguna';

function formatTanggal(nilai: unknown): string {
  if (!nilai) return 'Belum diperiksa';

  let tanggal: Date;

  if (nilai instanceof Date) {
    tanggal = nilai;
  } else if (
    typeof nilai === 'object' &&
    nilai !== null &&
    'toDate' in nilai &&
    typeof nilai.toDate === 'function'
  ) {
    tanggal = nilai.toDate();
  } else {
    tanggal = new Date(nilai as string | number);
  }

  if (Number.isNaN(tanggal.getTime())) return 'Belum tersedia';

  return tanggal.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DetailIzinScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { pengguna } = useAuth();

  const uid = pengguna?.uid ?? null;
  const {
    izin: izinPraktikan,
    loading: loadingPraktikan,
    error: errorPraktikan,
  } = useIzinPengguna(pengguna?.peran === 'PRAKTIKAN' ? uid : null);
  const {
    izin: izinAsisten,
    loading: loadingAsisten,
    error: errorAsisten,
  } = useIzinAsisten(pengguna?.peran === 'ASISTEN' ? uid : null);

  const izin = pengguna?.peran === 'ASISTEN' ? izinAsisten : izinPraktikan;
  const loading =
    pengguna?.peran === 'ASISTEN' ? loadingAsisten : loadingPraktikan;
  const error = pengguna?.peran === 'ASISTEN' ? errorAsisten : errorPraktikan;

  const dataIzin = useMemo(
    () => izin.find((item) => item.idIzin === id),
    [izin, id],
  );

  if (loading) {
    return <LoadingState pesan="Memuat detail pengajuan..." />;
  }

  if (error) {
    return <ErrorState judul="Gagal memuat detail izin" pesan={error} />;
  }

  if (!dataIzin) {
    return (
      <View style={styles.emptyWrap}>
        <EmptyState
          judul="Pengajuan tidak ditemukan"
          pesan="Data tidak tersedia untuk akun ini."
        />
      </View>
    );
  }

  const statusMeta =
    dataIzin.statusIzin === 'DISETUJUI'
      ? {
          bg: Colors.light.successSoft,
          border: '#CDEEE0',
          icon: <IconCheckCircle size={20} color={Colors.light.success} />,
          summary: 'Pengajuan izin disetujui.',
        }
      : dataIzin.statusIzin === 'DITOLAK'
        ? {
            bg: Colors.light.dangerSoft,
            border: '#FAD0DC',
            icon: <IconXCircle size={20} color={Colors.light.danger} />,
            summary: 'Pengajuan izin ditolak.',
          }
        : {
            bg: Colors.light.warningSoft,
            border: '#F6DFB0',
            icon: <IconClock size={20} color={Colors.light.warning} />,
            summary: 'Menunggu pemeriksaan asisten.',
          };

  const statusCard = (
    <View
      style={[
        styles.statusCard,
        { backgroundColor: statusMeta.bg, borderColor: statusMeta.border },
      ]}
    >
      <View style={styles.statusTopRow}>
        <View style={styles.statusIconCircle}>{statusMeta.icon}</View>
        <View style={styles.statusTopInfo}>
          <StatusBadge status={dataIzin.statusIzin} />
          <Text style={styles.statusSummary}>{statusMeta.summary}</Text>
        </View>
      </View>

      <View style={styles.metaGrid}>
        <View style={styles.metaCol}>
          <Text style={styles.metaLabel}>Diajukan</Text>
          <Text style={styles.metaValue} numberOfLines={1}>
            {formatTanggal(dataIzin.dibuatPada)}
          </Text>
        </View>

        <View style={styles.metaCol}>
          <Text style={styles.metaLabel}>Diperiksa</Text>
          <Text style={styles.metaValue} numberOfLines={1}>
            {formatTanggal(dataIzin.waktuPeriksa)}
          </Text>
        </View>
      </View>
    </View>
  );

  if (pengguna?.peran === 'ASISTEN') {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {statusCard}
        <DetailIzinAsisten izin={dataIzin} />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {statusCard}

      <View style={styles.card}>
        <View style={styles.reasonHeaderRow}>
          <Text style={styles.sectionTitle}>Alasan Izin</Text>
          <View style={styles.sesiPill}>
            <Text style={styles.sesiPillText}>{dataIzin.sesiId}</Text>
          </View>
        </View>

        <View style={styles.reasonQuote}>
          <Text style={styles.reasonText}>{dataIzin.alasan}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.aiHeaderRow}>
          <IconSparkles size={16} color={Colors.light.brandMid} />
          <Text style={styles.sectionTitle}>Klasifikasi AI</Text>
        </View>

        <KategoriAiBadge
          kategori={dataIzin.kategoriAi}
          statusAi={dataIzin.statusAi}
          versiKategoriAi={dataIzin.versiKategoriAi}
        />

        <Text style={styles.note}>
          Rekomendasi AI · keputusan akhir di asisten
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  emptyWrap: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: 20,
    justifyContent: 'center',
  },
  container: {
    padding: 20,
    paddingTop: 14,
    paddingBottom: Spacing.five,
    gap: 14,
  },
  statusCard: {
    padding: 16,
    borderRadius: Radii.xl,
    borderWidth: 1,
    gap: 14,
    ...Shadows.subtle,
  },
  statusTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.light.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  statusTopInfo: {
    flex: 1,
    gap: 5,
  },
  statusSummary: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.light.text,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: Radii.md,
    padding: 12,
  },
  metaCol: {
    flex: 1,
    gap: 2,
  },
  metaLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  metaValue: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.light.text,
  },
  card: {
    padding: 18,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    gap: 12,
    ...Shadows.card,
  },
  reasonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: Fonts.sansBold,
    color: Colors.light.text,
    fontSize: 15,
  },
  sesiPill: {
    backgroundColor: Colors.light.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  sesiPillText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.light.primary,
  },
  reasonQuote: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.brandMid,
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  reasonText: {
    fontFamily: Fonts.sans,
    color: Colors.light.text,
    fontSize: 14,
    lineHeight: 21,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  note: {
    fontFamily: Fonts.sans,
    color: Colors.light.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
});
