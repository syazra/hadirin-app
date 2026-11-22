import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

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
        <Pressable
          onPress={onPressLihatSemua}
          hitSlop={8}
          style={({ pressed }) => [pressed && styles.itemPressed]}
        >
          <Text style={styles.lihatSemuaText}>Lihat semua</Text>
        </Pressable>
      </View>

      <View style={styles.upcomingCard}>
        {items.length === 0 ? (
          <Text style={styles.emptyUpcomingText}>
            Tidak ada jadwal praktikum dalam 1 minggu ke depan.
          </Text>
        ) : (
          <View>
            {items.map((item, index) => (
              <Pressable
                key={item.idSesi}
                style={({ pressed }) => [
                  styles.upcomingItem,
                  index < items.length - 1 && styles.upcomingItemBorder,
                  pressed && styles.itemPressed,
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
                    <Text style={styles.upcomingClassSub} numberOfLines={2}>
                      {item.namaPraktikum}
                    </Text>
                  ) : null}
                  <Text style={styles.upcomingTimeSub}>{item.rentangWaktu}</Text>
                </View>

                {item.lokasi ? (
                  <View style={styles.labBadge}>
                    <Text style={styles.labBadgeText}>{item.lokasi}</Text>
                  </View>
                ) : null}
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  upcomingSection: {
    gap: 14,
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
  lihatSemuaText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    lineHeight: 17,
    color: Colors.light.primary,
  },
  upcomingCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 14,
  },
  upcomingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  dateBox: {
    width: 50,
    height: 56,
    borderRadius: 14,
    backgroundColor: Colors.light.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDayText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    lineHeight: 14,
    color: Colors.light.primary,
    marginBottom: 1,
  },
  dateNumText: {
    fontFamily: Fonts.sansBold,
    fontSize: 17,
    lineHeight: 21,
    color: Colors.light.primary,
  },
  upcomingCenter: {
    flex: 1,
  },
  upcomingMeetingTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    lineHeight: 19,
    color: Colors.light.text,
    marginBottom: 3,
  },
  upcomingClassSub: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.light.textSecondary,
    marginBottom: 3,
  },
  upcomingTimeSub: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.light.textSecondary,
  },
  labBadge: {
    backgroundColor: Colors.light.backgroundElement,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  labBadgeText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    lineHeight: 15,
    color: Colors.light.text,
  },
  emptyUpcomingText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.textSecondary,
    paddingVertical: 16,
  },
  itemPressed: {
    opacity: 0.7,
  },
});