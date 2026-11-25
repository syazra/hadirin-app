import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { IconAlertCircle } from '@/components/ui/icons';
import { PopBadge } from '@/components/ui/motion';
import { MotionSprings } from '@/constants/motion';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';

function AnimatedSegment({
  targetWidth,
  color,
}: {
  targetWidth: number;
  color: string;
}) {
  const reducedMotion = useReducedMotion();
  const width = useSharedValue(reducedMotion ? targetWidth : 0);

  useEffect(() => {
    if (reducedMotion) {
      width.set(targetWidth);
    } else {
      width.set(withSpring(targetWidth, MotionSprings.gentle));
    }
  }, [reducedMotion, targetWidth, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: Math.max(0, width.get()),
  }));

  return (
    <Animated.View
      style={[
        styles.progressSegment,
        { backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
}

export interface RingkasanHadirProps {
  jumlahHadir: number;
  jumlahSakit?: number;
  jumlahIzin?: number;
  jumlahAlpha?: number;
  jumlahBelumHadir?: number;
  jumlahIzinMenunggu?: number;
  label?: string;
  satuan?: string;
}

export function RingkasanHadir({
  jumlahHadir,
  jumlahSakit = 0,
  jumlahIzin = 0,
  jumlahAlpha = 0,
  jumlahBelumHadir = 0,
  jumlahIzinMenunggu = 0,
  label = 'Ringkasan',
  satuan = 'praktikan',
}: RingkasanHadirProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const total =
    jumlahHadir + jumlahSakit + jumlahIzin + jumlahAlpha + jumlahBelumHadir;
  const persenHadir = total > 0 ? Math.round((jumlahHadir / total) * 100) : 0;

  const segments = [
    { key: 'hadir', count: jumlahHadir, color: Colors.light.success },
    { key: 'sakit', count: jumlahSakit, color: Colors.light.brandMid },
    { key: 'izin', count: jumlahIzin, color: Colors.light.primary },
    { key: 'alpha', count: jumlahAlpha, color: Colors.light.danger },
    { key: 'belum', count: jumlahBelumHadir, color: '#D6CFC7' },
  ].filter((seg) => seg.count > 0);

  const totalGap = Math.max(0, segments.length - 1) * 2;
  const availableWidth = Math.max(0, trackWidth - totalGap);

  const metrics = [
    {
      key: 'hadir',
      label: 'Hadir',
      count: jumlahHadir,
      bg: Colors.light.successSoft,
      fg: Colors.light.success,
    },
    {
      key: 'sakit',
      label: 'Sakit',
      count: jumlahSakit,
      bg: Colors.light.brandMidSoft,
      fg: Colors.light.brandMid,
    },
    {
      key: 'izin',
      label: 'Izin',
      count: jumlahIzin,
      bg: Colors.light.primarySoft,
      fg: Colors.light.primary,
    },
    {
      key: 'alpha',
      label: 'Alpha',
      count: jumlahAlpha,
      bg: Colors.light.dangerSoft,
      fg: Colors.light.danger,
    },
    {
      key: 'belum',
      label: 'Belum',
      count: jumlahBelumHadir,
      bg: Colors.light.backgroundElement,
      fg: Colors.light.textSecondary,
    },
  ];

  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${jumlahHadir} hadir, ${jumlahSakit} sakit, ${jumlahIzin} izin, ${jumlahAlpha} alpha, ${jumlahBelumHadir} belum hadir ${satuan}`}
      accessibilityLiveRegion="polite"
      style={styles.container}
    >
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <PopBadge triggerKey={persenHadir}>
          <View style={styles.rateBadge}>
            <Text style={styles.rateText}>{persenHadir}% hadir</Text>
          </View>
        </PopBadge>
      </View>

      <View
        style={styles.progressTrack}
        onLayout={(event) => {
          const w = event.nativeEvent.layout.width;
          if (w !== trackWidth) {
            setTrackWidth(w);
          }
        }}
      >
        {segments.length === 0 ? (
          <View style={styles.progressEmpty} />
        ) : (
          segments.map((seg) => (
            <AnimatedSegment
              key={seg.key}
              targetWidth={
                total > 0 && availableWidth > 0
                  ? (seg.count / total) * availableWidth
                  : 0
              }
              color={seg.color}
            />
          ))
        )}
      </View>

      <View style={styles.grid}>
        {metrics.map((m) => (
          <View
            key={m.key}
            style={[styles.statBox, { backgroundColor: m.bg }]}
          >
            <PopBadge triggerKey={m.count}>
              <Text style={[styles.countText, { color: m.fg }]}>{m.count}</Text>
            </PopBadge>
            <Text style={styles.statLabel} numberOfLines={1}>
              {m.label}
            </Text>
          </View>
        ))}
      </View>

      {jumlahIzinMenunggu > 0 && (
        <View style={styles.notePill}>
          <IconAlertCircle size={15} color={Colors.light.warning} />
          <Text style={styles.catatan}>
            {jumlahIzinMenunggu} izin menunggu pemeriksaan
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    gap: 14,
    borderRadius: Radii.xl,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  label: {
    fontFamily: Fonts.sansBold,
    color: Colors.light.text,
    fontSize: 15.5,
  },
  rateBadge: {
    backgroundColor: Colors.light.successSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  rateText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.light.success,
  },
  progressTrack: {
    height: 8,
    borderRadius: Radii.pill,
    backgroundColor: Colors.light.backgroundElement,
    overflow: 'hidden',
    flexDirection: 'row',
    gap: 2,
  },
  progressEmpty: {
    flex: 1,
    backgroundColor: Colors.light.backgroundElement,
  },
  progressSegment: {
    height: '100%',
    borderRadius: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statBox: {
    minWidth: '17%',
    flexGrow: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: Radii.md,
    alignItems: 'center',
    gap: 2,
  },
  countText: {
    fontFamily: Fonts.sansBold,
    fontSize: 19,
    lineHeight: 23,
  },
  statLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  notePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: Colors.light.warningSoft,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: Radii.md,
  },
  catatan: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.light.warning,
  },
});
