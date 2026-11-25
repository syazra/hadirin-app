import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { EnterView } from '@/components/ui/motion';
import { Colors, Fonts } from '@/constants/theme';

type LoadingStateProps = {
  /** Teks di bawah indikator. Sebutkan apa yang dimuat, mis. "Memuat kelas…". */
  pesan?: string;
  /** true: mengisi seluruh layar (default). false: ringkas, untuk di dalam kartu atau daftar. */
  layarPenuh?: boolean;
};

export function LoadingState({
  pesan = 'Memuat data…',
  layarPenuh = true,
}: LoadingStateProps) {
  const reducedMotion = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      cancelAnimation(pulse);
      pulse.set(0);
      return;
    }

    pulse.set(0);
    pulse.set(
      withRepeat(
        withTiming(1, {
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true,
      ),
    );

    return () => {
      cancelAnimation(pulse);
    };
  }, [pulse, reducedMotion]);

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.get(), [0, 1], [1, 1.12]) }],
    opacity: interpolate(pulse.get(), [0, 1], [0.65, 1]),
  }));

  return (
    <EnterView
      distance={8}
      style={layarPenuh ? styles.layarPenuhWrap : undefined}
    >
      <View
        style={[styles.wadah, layarPenuh ? styles.layarPenuh : styles.ringkas]}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={pesan}
        accessibilityLiveRegion="polite"
      >
        <View style={styles.spinnerWrap}>
          <Animated.View style={[styles.spinnerPill, haloStyle]} />
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
        <Text style={styles.pesan}>{pesan}</Text>
      </View>
    </EnterView>
  );
}

const styles = StyleSheet.create({
  layarPenuhWrap: {
    flex: 1,
  },
  wadah: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 24,
  },
  layarPenuh: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  ringkas: {
    paddingVertical: 24,
  },
  spinnerWrap: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerPill: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.light.primarySoft,
  },
  pesan: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13.5,
    lineHeight: 19,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});
