import { StyleSheet, Text, View } from 'react-native';

import { BrandGradient } from '@/components/ui/brand-gradient';
import {
  IconCalendar,
  IconChevronRight,
  IconClock,
  IconMapPin,
} from '@/components/ui/icons';
import { LivePulseDot, PopBadge, PressableScale, ShimmerBox } from '@/components/ui/motion';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';

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
    <BrandGradient variant="brand" style={[styles.activeSessionCard, Shadows.primaryGlow]}>
      <View style={styles.activeSessionTop}>
        <View style={styles.aktifPill}>
          <LivePulseDot color="#FFFFFF" size={7} />
          <Text style={styles.aktifPillText}>Sesi aktif</Text>
        </View>
        {infoKananAtas ? (
          <PopBadge triggerKey={infoKananAtas}>
            <View style={styles.counterPill}>
              <Text style={styles.hadirCounterText}>{infoKananAtas}</Text>
            </View>
          </PopBadge>
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
            <IconMapPin size={14} color="rgba(255,255,255,0.9)" />
            <Text style={styles.activeMetaText}>{lokasi}</Text>
          </View>
        ) : null}

        <View style={styles.activeMetaItem}>
          <IconClock size={14} color="rgba(255,255,255,0.9)" />
          <Text style={styles.activeMetaText}>{rentangWaktu}</Text>
        </View>
      </View>

      <PressableScale
        style={styles.actionButton}
        scaleTo={0.97}
        onPress={onPressTombol}
      >
        <Text style={styles.actionButtonText}>{labelTombol}</Text>
        <IconChevronRight size={17} color={Colors.light.primary} strokeWidth={2.2} />
      </PressableScale>
    </BrandGradient>
  );
}

export function SesiAktifKosongCard() {
  return (
    <View style={styles.emptySessionCard}>
      <View style={styles.emptyIconCircle}>
        <IconCalendar size={20} color={Colors.light.warm} />
      </View>
      <View style={styles.emptyTextWrap}>
        <Text style={styles.emptySessionTitle}>Tidak ada sesi aktif</Text>
        <Text style={styles.emptySessionSubtitle}>
          Sesi yang dibuka akan muncul di sini
        </Text>
      </View>
    </View>
  );
}

export function SesiAktifSkeleton() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.activeSessionTop}>
        <ShimmerBox width={94} height={24} borderRadius={Radii.pill} />
        <ShimmerBox width={78} height={24} borderRadius={Radii.pill} />
      </View>
      <ShimmerBox width="72%" height={22} borderRadius={8} />
      <ShimmerBox width="52%" height={16} borderRadius={8} />
      <View style={styles.skeletonMetaRow}>
        <ShimmerBox width={96} height={14} borderRadius={7} />
        <ShimmerBox width={116} height={14} borderRadius={7} />
      </View>
      <ShimmerBox width="100%" height={44} borderRadius={Radii.md} />
    </View>
  );
}

const styles = StyleSheet.create({
  activeSessionCard: {
    borderRadius: Radii.xl,
    padding: 20,
  },
  activeSessionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  aktifPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  aktifPillText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 16,
    color: '#FFFFFF',
  },
  counterPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  hadirCounterText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 16,
    color: '#FFFFFF',
  },
  activeSessionTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 19,
    lineHeight: 25,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  activeSessionSubtitle: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13.5,
    lineHeight: 19,
    color: 'rgba(255, 255, 255, 0.88)',
    marginBottom: 14,
  },
  activeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 18,
  },
  activeMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeMetaText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12.5,
    lineHeight: 16,
    color: 'rgba(255, 255, 255, 0.92)',
  },
  actionButton: {
    backgroundColor: Colors.light.card,
    borderRadius: Radii.md,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...Shadows.subtle,
  },
  actionButtonText: {
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    lineHeight: 18,
    color: Colors.light.primary,
  },
  emptySessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: Radii.xl,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.card,
  },
  emptyIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: Colors.light.warmSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTextWrap: {
    flex: 1,
    gap: 2,
  },
  emptySessionTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.light.text,
  },
  emptySessionSubtitle: {
    fontFamily: Fonts.sans,
    fontSize: 12.5,
    lineHeight: 17,
    color: Colors.light.textSecondary,
  },
  skeletonCard: {
    backgroundColor: Colors.light.card,
    borderRadius: Radii.xl,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.card,
  },
  skeletonMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 2,
  },
});
