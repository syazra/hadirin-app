import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { IconClock } from '@/components/ui/icons';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
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
                ? 'Dibuka'
                : 'Berlangsung'
              : 'Terjadwal'}
          </Text>
        </View>
      </View>

      <Text style={styles.sesiTitle} numberOfLines={2}>
        {item.judulSesi}
      </Text>

      <View style={styles.timeRow}>
        <IconClock size={12.5} color={Colors.light.textSecondary} />
        <Text style={styles.waktuText}>
          {sedangBerlangsung
            ? formatRentangJamJakarta(item.waktuMulai, item.waktuSelesai)
            : formatJadwalJakarta(item.waktuMulai, item.waktuSelesai)}
        </Text>
      </View>
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
        <Text style={styles.sectionTitle}>Saat Ini</Text>
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
              Tidak ada praktikum saat ini.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Berikutnya</Text>
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
              Belum ada jadwal berikutnya.
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
    fontFamily: Fonts.sansBold,
    fontSize: 13.5,
    color: Colors.light.text,
  },
  itemCard: {
    padding: 13,
    borderRadius: Radii.md,
    borderWidth: 1,
    gap: 5,
  },
  itemCardActive: {
    backgroundColor: Colors.light.successSoft,
    borderColor: '#C4EBD8',
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
    fontFamily: Fonts.sansBold,
    fontSize: 13.5,
    color: Colors.light.text,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  badgeActive: {
    backgroundColor: Colors.light.card,
  },
  badgeUpcoming: {
    backgroundColor: Colors.light.primarySoft,
  },
  badgeText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
  },
  badgeTextActive: {
    color: Colors.light.success,
  },
  badgeTextUpcoming: {
    color: Colors.light.primary,
  },
  sesiTitle: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12.5,
    color: Colors.light.textSecondary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  waktuText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.light.text,
  },
  emptyBox: {
    padding: 13,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundElement,
  },
  emptyText: {
    fontFamily: Fonts.sans,
    fontSize: 12.5,
    color: Colors.light.textSecondary,
  },
  centerBox: {
    padding: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  errorBox: {
    padding: 14,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#FAD0DC',
    backgroundColor: Colors.light.dangerSoft,
    gap: 6,
  },
  errorTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    color: Colors.light.danger,
  },
  helperText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.sm,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  retryText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.light.text,
  },
});
