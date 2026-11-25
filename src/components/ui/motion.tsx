import { type ReactNode, useEffect } from 'react';
import {
  type DimensionValue,
  Pressable,
  type PressableProps,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  LinearTransition,
  cancelAnimation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import {
  MotionDurations,
  MotionSprings,
} from '@/constants/motion';
import { Colors } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressableScaleProps = Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  scaleTo?: number;
  activeOpacity?: number;
};

export function PressableScale({
  children,
  style,
  contentStyle,
  scaleTo = 0.97,
  activeOpacity = 0.92,
  disabled = false,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
    opacity: opacity.get(),
  }));

  const handlePressIn: PressableProps['onPressIn'] = (event) => {
    if (!disabled && !reducedMotion) {
      scale.set(withSpring(scaleTo, MotionSprings.press));
      opacity.set(withTiming(activeOpacity, { duration: MotionDurations.fast }));
    }
    onPressIn?.(event);
  };

  const handlePressOut: PressableProps['onPressOut'] = (event) => {
    if (!reducedMotion) {
      scale.set(withSpring(1, MotionSprings.press));
      opacity.set(withTiming(1, { duration: MotionDurations.fast }));
    }
    onPressOut?.(event);
  };

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, style, contentStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

type EnterViewProps = {
  children: ReactNode;
  delay?: number;
  distance?: number;
  scaleFrom?: number;
  style?: StyleProp<ViewStyle>;
  animateLayout?: boolean;
};

export function EnterView({
  children,
  delay = 0,
  distance = 14,
  scaleFrom = 1,
  style,
  animateLayout = false,
}: EnterViewProps) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  const translateY = useSharedValue(reducedMotion ? 0 : distance);
  const scale = useSharedValue(reducedMotion ? 1 : scaleFrom);

  useEffect(() => {
    if (reducedMotion) {
      opacity.set(1);
      translateY.set(0);
      scale.set(1);
      return;
    }

    opacity.set(
      withDelay(
        delay,
        withTiming(1, {
          duration: MotionDurations.normal,
          easing: Easing.out(Easing.cubic),
        }),
      ),
    );
    translateY.set(withDelay(delay, withSpring(0, MotionSprings.gentle)));
    scale.set(withDelay(delay, withSpring(1, MotionSprings.gentle)));
  }, [delay, opacity, reducedMotion, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ translateY: translateY.get() }, { scale: scale.get() }],
  }));

  const layoutAnimation =
    animateLayout && !reducedMotion
      ? LinearTransition.springify().damping(22).stiffness(240)
      : undefined;

  return (
    <Animated.View layout={layoutAnimation} style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

type LivePulseDotProps = {
  color: string;
  size?: number;
};

export function LivePulseDot({ color, size = 7 }: LivePulseDotProps) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      cancelAnimation(progress);
      progress.set(0);
      return;
    }

    progress.set(0);
    progress.set(
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: 1300,
            easing: Easing.out(Easing.quad),
          }),
          withTiming(0, { duration: 0 }),
          withDelay(500, withTiming(0, { duration: 0 })),
        ),
        -1,
        false,
      ),
    );

    return () => {
      cancelAnimation(progress);
    };
  }, [progress, reducedMotion]);

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.get(), [0, 1], [1, 2.3]) }],
    opacity: interpolate(progress.get(), [0, 1], [0.6, 0]),
  }));

  const boxSize = size * 2;

  return (
    <View
      style={[
        styles.pulseWrap,
        {
          width: boxSize,
          height: boxSize,
        },
      ]}
    >
      {!reducedMotion ? (
        <Animated.View
          style={[
            styles.pulseHalo,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: color,
            },
            haloStyle,
          ]}
        />
      ) : null}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

type PopBadgeProps = {
  children: ReactNode;
  triggerKey?: string | number;
  style?: StyleProp<ViewStyle>;
};

export function PopBadge({ children, triggerKey, style }: PopBadgeProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) {
      scale.set(1);
      return;
    }

    scale.set(
      withSequence(
        withTiming(0.86, { duration: 70 }),
        withSpring(1, MotionSprings.bouncy),
      ),
    );
  }, [reducedMotion, scale, triggerKey]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>
  );
}

type ShimmerBoxProps = {
  width?: DimensionValue;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

export function ShimmerBox({
  width = '100%',
  height,
  borderRadius = 12,
  style,
}: ShimmerBoxProps) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(reducedMotion ? 0.7 : 0.45);

  useEffect(() => {
    if (reducedMotion) {
      cancelAnimation(opacity);
      opacity.set(0.7);
      return;
    }

    opacity.set(0.45);
    opacity.set(
      withRepeat(
        withTiming(0.9, {
          duration: 850,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true,
      ),
    );

    return () => {
      cancelAnimation(opacity);
    };
  }, [opacity, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
  }));

  return (
    <Animated.View
      style={[
        styles.shimmer,
        {
          width,
          height,
          borderRadius,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

type AnimatedTabPillProps = {
  focused: boolean;
  children: ReactNode;
  activeBackgroundColor?: string;
};

export function AnimatedTabPill({
  focused,
  children,
  activeBackgroundColor = Colors.light.primarySoft,
}: AnimatedTabPillProps) {
  const reducedMotion = useReducedMotion();
  const springProgress = useSharedValue(focused ? 1 : 0);
  const bgProgress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    const target = focused ? 1 : 0;
    if (reducedMotion) {
      springProgress.set(target);
      bgProgress.set(target);
      return;
    }

    springProgress.set(withSpring(target, MotionSprings.bouncy));
    bgProgress.set(withTiming(target, { duration: MotionDurations.fast }));
  }, [bgProgress, focused, reducedMotion, springProgress]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      bgProgress.get(),
      [0, 1],
      ['rgba(59, 91, 255, 0)', activeBackgroundColor],
    ),
    transform: [
      { scale: interpolate(springProgress.get(), [0, 1], [0.92, 1]) },
      { translateY: interpolate(springProgress.get(), [0, 1], [0, -1]) },
    ],
  }));

  return (
    <Animated.View style={[styles.tabPill, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pulseWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseHalo: {
    position: 'absolute',
  },
  shimmer: {
    backgroundColor: '#EAE4DC',
  },
  tabPill: {
    paddingHorizontal: 18,
    paddingVertical: 5,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
