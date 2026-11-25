import { type ReactNode, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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

import { IconCalendar, IconInbox } from '@/components/ui/icons';
import { EnterView } from '@/components/ui/motion';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';

type EmptyStateProps = {
  judul: string;
  pesan: string;
  emoji?: string;
  icon?: ReactNode;
};

export function EmptyState({
  judul,
  pesan,
  emoji,
  icon,
}: EmptyStateProps) {
  const reducedMotion = useReducedMotion();
  const breath = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      cancelAnimation(breath);
      breath.set(0);
      return;
    }

    breath.set(0);
    breath.set(
      withRepeat(
        withTiming(1, {
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true,
      ),
    );

    return () => {
      cancelAnimation(breath);
    };
  }, [breath, reducedMotion]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(breath.get(), [0, 1], [1, 1.05]) }],
  }));

  const renderedIcon =
    icon ??
    (emoji === '📅' ? (
      <IconCalendar size={26} color={Colors.light.warm} />
    ) : (
      <IconInbox size={26} color={Colors.light.warm} />
    ));

  return (
    <EnterView distance={10}>
      <View style={styles.container}>
        <Animated.View style={[styles.outerRing, ringStyle]}>
          <View style={styles.innerCircle}>{renderedIcon}</View>
        </Animated.View>

        <View style={styles.textWrap}>
          <Text style={styles.title}>{judul}</Text>
          <Text style={styles.message}>{pesan}</Text>
        </View>
      </View>
    </EnterView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderRadius: Radii.xl,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 14,
    ...Shadows.subtle,
  },
  outerRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.light.warmSoft,
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
  textWrap: {
    alignItems: 'center',
    gap: 5,
    maxWidth: 280,
  },
  title: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    lineHeight: 21,
    color: Colors.light.text,
    textAlign: 'center',
  },
  message: {
    fontFamily: Fonts.sans,
    fontSize: 13.5,
    lineHeight: 19,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});
