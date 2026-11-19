import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { useLaboratoryActivities } from '@/hooks/use-laboratory-activities';
import {
    formatJadwalJakarta,
    formatRentangJamJakarta,
    type AktivitasLaboratoriumItem,
} from '@/services/laboratory-activity-service';

export interface LaboratoryActivityListProps {
  labId: string | null | undefined;
}

function KartuAktivitas({
  item,
  sedangBerlangsung,
}: {
  item: AktivitasLaboratoriumItem;
  sedangBerlangsung: boolean;
}) {
  return (
    <View
      style={[
        styles.itemCard,
        sedangBerlangsung ? styles.itemCardActive : styles.itemCardUpcoming,
      ]}
    >
      <View style={styles.itemHeader}>
        <Text style={styles.kelasName} numberOfLines={1}>
          {item.namaPraktikum}
        </Text>
        <View
          style={[
            styles.badge,
            sedangBerlangsung ? styles.badgeActive : styles.badgeUpcoming,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              sedangBerlangsung
                ? styles.badgeTextActive
                : styles.badgeTextUpcoming,
            ]}
          >
            {sedangBerlangsung
              ? item.statusSesi === 'DIBUKA'
                ? 'Presensi Dibuka'
                : 'Berlangsung'
              : 'Terjadwal'}
          </Text>
        </View>
      </View>

      <Text style={styles.sesiTitle} numberOfLines={2}>
        {item.judulSesi}
      </Text>

      <Text style={styles.waktuText}>
        {sedangBerlangsung
          ? formatRentangJamJakarta(item.waktuMulai, item.waktuSelesai)
          : formatJadwalJakarta(item.waktuMulai, item.waktuSelesai)}
      </Text>
    </View>
  );
}

export function LaboratoryActivityList({
  labId,
}: LaboratoryActivityListProps) {
  const {
    currentActivities,
    nextActivities,
    loading,
    error,
    muatUlang,
  } = useLaboratoryActivities(labId);

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="small" color={Colors.light.primary} />
        <Text style={styles.helperText}>Memuat aktivitas laboratorium...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorBox}>
        <Text style={styles.errorTitle}>Gagal memuat aktivitas</Text>
        <Text style={styles.helperText}>{error}</Text>
        <Pressable
          onPress={muatUlang}
          style={styles.retryButton}
          accessibilityRole="button"
        >
          <Text style={styles.retryText}>Coba Lagi</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Praktikum Saat Ini</Text>
        {currentActivities.length > 0 ? (
          currentActivities.map((item) => (
            <KartuAktivitas
              key={item.idSesi}
              item={item}
              sedangBerlangsung
            />
          ))
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              Tidak ada praktikum yang sedang berlangsung saat ini.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Praktikum Berikutnya</Text>
        {nextActivities.length > 0 ? (
          nextActivities.map((item) => (
            <KartuAktivitas
              key={item.idSesi}
              item={item}
              sedangBerlangsung={false}
            />
          ))
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              Belum ada praktikum berikutnya
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  itemCard: {
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  itemCardActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  itemCardUpcoming: {
    backgroundColor: Colors.light.card,
    borderColor: Colors.light.border,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  kelasName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeActive: {
    backgroundColor: '#D1FAE5',
  },
  badgeUpcoming: {
    backgroundColor: '#EFF6FF',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeTextActive: {
    color: '#065F46',
  },
  badgeTextUpcoming: {
    color: '#1E40AF',
  },
  sesiTitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  waktuText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 2,
  },
  emptyBox: {
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  centerBox: {
    padding: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  errorBox: {
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    gap: 6,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
  },
  helperText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  retryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
});