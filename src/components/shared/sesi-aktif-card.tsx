import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Colors, Fonts } from '@/constants/theme';

export interface SesiAktifCardProps {
  namaPraktikum: string;
  judul: string;
  lokasi?: string | null;
  rentangWaktu: string;
  infoKananAtas?: string;
  labelTombol: string;
  onPressTombol: () => void;
}

export function SesiAktifCard({
  namaPraktikum,
  judul,
  lokasi,
  rentangWaktu,
  infoKananAtas,
  labelTombol,
  onPressTombol,
}: SesiAktifCardProps) {
  return (
    <View style={styles.activeSessionCard}>
      <View style={styles.activeSessionTop}>
        <View style={styles.aktifPill}>
          <Text style={styles.aktifPillText}>Sesi aktif</Text>
        </View>
        {infoKananAtas ? (
          <Text style={styles.hadirCounterText}>{infoKananAtas}</Text>
        ) : null}
      </View>

      <Text style={styles.activeSessionTitle} numberOfLines={2}>
        {namaPraktikum}
      </Text>
      <Text style={styles.activeSessionSubtitle} numberOfLines={2}>
        {judul}
      </Text>

      <View style={styles.activeMetaRow}>
        {lokasi ? (
          <View style={styles.activeMetaItem}>
            <Svg
              width={14}
              height={14}
              viewBox="0 0 24 24"
              fill="none"
              stroke={Colors.light.primarySoft}
              strokeWidth={2}
            >
              <Path d="M12 21s-6-5.33-6-10a6 6 0 1 1 12 0c0 4.67-6 10-6 10Z" />
              <Circle cx={12} cy={11} r={2} />
            </Svg>
            <Text style={styles.activeMetaText}>{lokasi}</Text>
          </View>
        ) : null}

        <View style={styles.activeMetaItem}>
          <Svg
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke={Colors.light.primarySoft}
            strokeWidth={2}
          >
            <Circle cx={12} cy={12} r={9} />
            <Path d="M12 7v5l3 2" />
          </Svg>
          <Text style={styles.activeMetaText}>{rentangWaktu}</Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.actionButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={onPressTombol}
      >
        <Text style={styles.actionButtonText}>{labelTombol}</Text>
      </Pressable>
    </View>
  );
}

export function SesiAktifKosongCard() {
  return (
    <View style={styles.emptySessionCard}>
      <View style={styles.emptySessionTop}>
        <Text style={styles.emptySessionTitle}>Sesi aktif</Text>
        <View style={styles.nonaktifBadge}>
          <Text style={styles.nonaktifBadgeText}>TIDAK ADA</Text>
        </View>
      </View>
      <Text style={styles.emptySessionSubtitle}>
        Belum ada sesi praktikum yang sedang dibuka saat ini.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  activeSessionCard: {
    backgroundColor: Colors.light.primary,
    borderRadius: 22,
    padding: 20,
  },
  activeSessionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  aktifPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  aktifPillText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.light.card,
  },
  hadirCounterText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    lineHeight: 17,
    color: Colors.light.primarySoft,
  },
  activeSessionTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 18,
    lineHeight: 24,
    color: Colors.light.card,
    marginBottom: 6,
  },
  activeSessionSubtitle: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.light.primarySoft,
    marginBottom: 14,
  },
  activeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 18,
  },
  activeMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeMetaText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.light.primarySoft,
  },
  actionButton: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  actionButtonText: {
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    lineHeight: 18,
    color: Colors.light.primary,
  },
  emptySessionCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  emptySessionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptySessionTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.light.text,
  },
  nonaktifBadge: {
    backgroundColor: Colors.light.backgroundElement,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  nonaktifBadgeText: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    lineHeight: 14,
    color: Colors.light.textSecondary,
  },
  emptySessionSubtitle: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.textSecondary,
  },
});