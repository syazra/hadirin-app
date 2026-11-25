import { type PropsWithChildren, useEffect, useId } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
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
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Rect,
  Stop,
} from 'react-native-svg';

export type BrandGradientVariant = 'brand' | 'indigo' | 'emerald' | 'warm';

type BrandGradientProps = PropsWithChildren<{
  variant?: BrandGradientVariant;
  decorative?: boolean;
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}>;

const GRADIENT_STOPS: Record<
  BrandGradientVariant,
  { stops: { offset: string; color: string }[]; fallback: string; orbColor: string }
> = {
  brand: {
    fallback: '#5C58F6',
    orbColor: '#FFFFFF',
    stops: [
      { offset: '0%', color: '#3556FF' },
      { offset: '54%', color: '#7B5BF2' },
      { offset: '100%', color: '#EC6BA6' },
    ],
  },
  indigo: {
    fallback: '#5758F5',
    orbColor: '#FFFFFF',
    stops: [
      { offset: '0%', color: '#3454F5' },
      { offset: '58%', color: '#6358F5' },
      { offset: '100%', color: '#9463F8' },
    ],
  },
  emerald: {
    fallback: '#1B966B',
    orbColor: '#FFFFFF',
    stops: [
      { offset: '0%', color: '#147D59' },
      { offset: '55%', color: '#1B966B' },
      { offset: '100%', color: '#29AD7E' },
    ],
  },
  warm: {
    fallback: '#FFF3EC',
    orbColor: '#EB5B97',
    stops: [
      { offset: '0%', color: '#FFF6EF' },
      { offset: '100%', color: '#FFF0F6' },
    ],
  },
};

export function BrandGradient({
  variant = 'brand',
  decorative = true,
  animated = true,
  style,
  children,
}: BrandGradientProps) {
  const rawId = useId();
  const gradientId = `bg-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const config = GRADIENT_STOPS[variant];
  const orbOpacityPrimary = variant === 'warm' ? 0.08 : 0.13;
  const orbOpacitySecondary = variant === 'warm' ? 0.05 : 0.08;
  const reducedMotion = useReducedMotion();
  const drift = useSharedValue(0);

  useEffect(() => {
    if (!decorative || !animated || reducedMotion) {
      cancelAnimation(drift);
      drift.set(0);
      return;
    }

    drift.set(0);
    drift.set(
      withRepeat(
        withTiming(1, {
          duration: 7000,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true,
      ),
    );

    return () => {
      cancelAnimation(drift);
    };
  }, [animated, decorative, drift, reducedMotion]);

  const orbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(drift.get(), [0, 1], [-6, 6]) },
      { translateY: interpolate(drift.get(), [0, 1], [4, -4]) },
      { scale: interpolate(drift.get(), [0, 1], [1, 1.04]) },
    ],
  }));

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: config.fallback },
        style,
      ]}
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 400 240"
          preserveAspectRatio="none"
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            <LinearGradient
              id={gradientId}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              {config.stops.map((stop) => (
                <Stop
                  key={stop.offset}
                  offset={stop.offset}
                  stopColor={stop.color}
                />
              ))}
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={400} height={240} fill={`url(#${gradientId})`} />
        </Svg>

        {decorative ? (
          <Animated.View style={[StyleSheet.absoluteFill, orbAnimatedStyle]}>
            <Svg
              width="100%"
              height="100%"
              viewBox="0 0 400 240"
              preserveAspectRatio="xMidYMid slice"
              style={StyleSheet.absoluteFill}
            >
              <Circle
                cx={356}
                cy={28}
                r={96}
                fill={config.orbColor}
                fillOpacity={orbOpacityPrimary}
              />
              <Circle
                cx={42}
                cy={224}
                r={74}
                fill={config.orbColor}
                fillOpacity={orbOpacitySecondary}
              />
            </Svg>
          </Animated.View>
        ) : null}
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
});
