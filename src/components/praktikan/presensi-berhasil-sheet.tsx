import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AppButton } from '@/components/ui/app-button';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { IconAlertCircle, IconCheckCircle } from '@/components/ui/icons';
import { EnterView } from '@/components/ui/motion';
import { MotionSprings } from '@/constants/motion';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';
import { formatWaktu } from '@/utils/format-waktu';

type PresensiBerhasilSheetProps = {
  visible: boolean;
  berhasil: boolean;
  judul: string;
  pesan: string;
  waktuPresensi?: Date | string | null;
  onClose: () => void;
};

export function PresensiBerhasilSheet({
  visible,
  berhasil,
  judul,
  pesan,
  waktuPresensi,
  onClose,
}: PresensiBerhasilSheetProps) {
  const reducedMotion = useReducedMotion();
  const ringScale = useSharedValue(1);
  const ringShakeX = useSharedValue(0);
  const rippleProgress = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(ringScale);
    cancelAnimation(ringShakeX);
    cancelAnimation(rippleProgress);

    if (!visible) {
      ringScale.set(1);
      ringShakeX.set(0);
      rippleProgress.set(0);
      return;
    }

    if (reducedMotion) {
      ringScale.set(1);
      ringShakeX.set(0);
      rippleProgress.set(0);
      return;
    }

    ringScale.set(0.55);
    ringScale.set(withDelay(60, withSpring(1, MotionSprings.bouncy)));

    if (berhasil) {
      ringShakeX.set(0);
      rippleProgress.set(0);
      rippleProgress.set(
        withDelay(
          140,
          withTiming(1, {
            duration: 750,
            easing: Easing.out(Easing.cubic),
          }),
        ),
      );
    } else {
      rippleProgress.set(0);
      ringShakeX.set(
        withDelay(
          120,
          withSequence(
            withTiming(-6, { duration: 45 }),
            withTiming(6, { duration: 55 }),
            withTiming(-4, { duration: 45 }),
            withTiming(4, { duration: 45 }),
            withTiming(0, { duration: 45 }),
          ),
        ),
      );
    }
  }, [berhasil, reducedMotion, ringScale, ringShakeX, rippleProgress, visible]);

  const medallionStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: ringScale.get() },
      { translateX: ringShakeX.get() },
    ],
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(rippleProgress.get(), [0, 1], [1, 1.65]) }],
    opacity: interpolate(rippleProgress.get(), [0, 1], [0.55, 0]),
  }));

  const latarStatus = berhasil
    ? Colors.light.successSoft
    : Colors.light.dangerSoft;

  const teksWaktu = (() => {
    if (!waktuPresensi) return null;
    if (waktuPresensi instanceof Date) {
      return formatWaktu(waktuPresensi);
    }
    const hasilFormat = formatWaktu(waktuPresensi);
    return hasilFormat === '-' && waktuPresensi.trim() !== '-'
      ? waktuPresensi
      : hasilFormat;
  })();

  return (
    <BottomSheet
      visible={visible}
      onTutup={onClose}
      accessibilityLabelTutup="Tutup informasi presensi"
    >
      <View style={styles.content}>
        <View style={styles.medallionWrap}>
          {berhasil && !reducedMotion ? (
            <Animated.View
              style={[
                styles.rippleRing,
                { borderColor: Colors.light.success },
                rippleStyle,
              ]}
            />
          ) : null}
          <Animated.View
            style={[
              styles.outerRing,
              { backgroundColor: latarStatus },
              medallionStyle,
            ]}
          >
            <View style={styles.innerCircle}>
              {berhasil ? (
                <IconCheckCircle size={30} color={Colors.light.success} strokeWidth={2.2} />
              ) : (
                <IconAlertCircle size={30} color={Colors.light.danger} strokeWidth={2.2} />
              )}
            </View>
          </Animated.View>
        </View>

        <Text style={styles.title}>{judul}</Text>
        <Text style={styles.description}>{pesan}</Text>

        {berhasil && teksWaktu && (
          <EnterView delay={120} distance={10} style={styles.timeCardWrap}>
            <View style={styles.timeCard}>
              <Text style={styles.timeLabel}>Waktu presensi</Text>
              <Text style={styles.timeValue}>{teksWaktu}</Text>
            </View>
          </EnterView>
        )}

        <AppButton
          title="Mengerti"
          onPress={onClose}
          variant="primary"
          size="large"
          fullWidth
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 8,
    paddingBottom: 4,
    alignItems: 'center',
    gap: 12,
  },
  medallionWrap: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rippleRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
  },
  outerRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.light.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  title: {
    fontFamily: Fonts.sansBold,
    color: Colors.light.text,
    fontSize: 20,
    textAlign: 'center',
  },
  description: {
    fontFamily: Fonts.sans,
    color: Colors.light.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  timeCardWrap: {
    width: '100%',
  },
  timeCard: {
    width: '100%',
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: Radii.md,
    padding: 14,
    gap: 4,
    alignItems: 'center',
  },
  timeLabel: {
    fontFamily: Fonts.sansMedium,
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
  timeValue: {
    fontFamily: Fonts.sansBold,
    color: Colors.light.text,
    fontSize: 15,
  },
});
