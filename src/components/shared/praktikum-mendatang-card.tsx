import { StyleSheet, Text, View } from 'react-native';

import { IconCalendar, IconChevronRight, IconClock } from '@/components/ui/icons';
import { EnterView, PressableScale } from '@/components/ui/motion';
import { getStaggerDelay } from '@/constants/motion';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';

export interface PraktikumMendatangItem {
  idSesi: string;
  hariSingkat: string;
  angkaTanggal: number;
  judul: string;
  namaPraktikum?: string;
  rentangWaktu: string;
  lokasi?: string | null;
}

export interface PraktikumMendatangCardProps {
  items: PraktikumMendatangItem[];
  onPressItem: (idSesi: string) => void;
  onPressLihatSemua: () => void;
}

export function PraktikumMendatangCard({
  items,
  onPressItem,
  onPressLihatSemua,
}: PraktikumMendatangCardProps) {
  return (
    <View style={styles.upcomingSection}>
      <View style={styles.upcomingSectionHeader}>
        <Text style={styles.sectionHeading}>Praktikum mendatang</Text>
        <PressableScale
          onPress={onPressLihatSemua}
          hitSlop={8}
          scaleTo={0.97}
          style={styles.lihatSemuaBtn}
        >
          <Text style={styles.lihatSemuaText}>Lihat semua</Text>
          <IconChevronRight size={15} color={Colors.light.primary} strokeWidth={2.2} />
        </PressableScale>
      </View>

      <View style={styles.upcomingCard}>
        {items.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconPill}>
              <IconCalendar size={18} color={Colors.light.warm} />
            </View>
            <Text style={styles.emptyUpcomingText}>
              Tidak ada jadwal praktikum 7 hari ke depan
            </Text>
          </View>
        ) : (
          <View>
            {items.map((item, index) => (
              <EnterView
                key={item.idSesi}
                delay={getStaggerDelay(index, 40)}
                distance={10}
              >
                <PressableScale
                  scaleTo={0.98}
                  style={[
                    styles.upcomingItem,
                    index < items.length - 1 && styles.upcomingItemBorder,
                  ]}
                  onPress={() => onPressItem(item.idSesi)}
                >
                  <View style={styles.dateBox}>
                    <Text style={styles.dateDayText}>{item.hariSingkat}</Text>
                    <Text style={styles.dateNumText}>{item.angkaTanggal}</Text>
                  </View>

                  <View style={styles.upcomingCenter}>
                    <Text style={styles.upcomingMeetingTitle} numberOfLines={2}>
                      {item.judul}
                    </Text>
                    {item.namaPraktikum ? (
                      <Text style={styles.upcomingClassSub} numberOfLines={1}>
                        {item.namaPraktikum}
                      </Text>
                    ) : null}
                    <View style={styles.timeRow}>
                      <IconClock size={12} color={Colors.light.textSecondary} />
                      <Text style={styles.upcomingTimeSub} numberOfLines={1}>
                        {item.rentangWaktu}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.rightCluster}>
                    {item.lokasi ? (
                      <View style={styles.labBadge}>
                        <Text style={styles.labBadgeText} numberOfLines={1}>
                          {item.lokasi}
                        </Text>
                      </View>
                    ) : null}
                    <IconChevronRight size={16} color={Colors.light.textSecondary} />
                  </View>
                </PressableScale>
              </EnterView>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  upcomingSection: {
    gap: 12,
  },
  upcomingSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeading: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    lineHeight: 20,
    color: Colors.light.text,
  },
  lihatSemuaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  lihatSemuaText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    lineHeight: 17,
    color: Colors.light.primary,
  },
  upcomingCard: {
    backgroundColor: Colors.light.card,
    borderRadius: Radii.xl,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.card,
  },
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  upcomingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  dateBox: {
    width: 48,
    height: 54,
    borderRadius: 15,
    backgroundColor: Colors.light.warmSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDayText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 10.5,
    lineHeight: 14,
    color: Colors.light.warm,
    textTransform: 'uppercase',
  },
  dateNumText: {
    fontFamily: Fonts.sansBold,
    fontSize: 17,
    lineHeight: 21,
    color: Colors.light.warm,
  },
  upcomingCenter: {
    flex: 1,
    gap: 2,
  },
  upcomingMeetingTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    lineHeight: 19,
    color: Colors.light.text,
  },
  upcomingClassSub: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.light.textSecondary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  upcomingTimeSub: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.light.textSecondary,
  },
  rightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  labBadge: {
    backgroundColor: Colors.light.backgroundElement,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    maxWidth: 118,
  },
  labBadgeText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    lineHeight: 14,
    color: Colors.light.text,
  },
  emptyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  emptyIconPill: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.light.warmSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyUpcomingText: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.textSecondary,
  },
});
