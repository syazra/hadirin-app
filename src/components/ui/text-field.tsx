import { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { EnterView } from '@/components/ui/motion';
import { MotionDurations } from '@/constants/motion';
import { Colors, Fonts, Radii } from '@/constants/theme';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  multiline?: boolean;
  maxLength?: number;
  editable?: boolean;
  showCounter?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
};

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  multiline,
  maxLength,
  editable = true,
  showCounter = false,
  keyboardType = 'default',
  autoCapitalize,
}: TextFieldProps) {
  const reducedMotion = useReducedMotion();
  const focusProgress = useSharedValue(0);
  const shakeX = useSharedValue(0);
  const prevErrorRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (error && error !== prevErrorRef.current && !reducedMotion) {
      shakeX.set(
        withSequence(
          withTiming(-6, { duration: 45 }),
          withTiming(6, { duration: 55 }),
          withTiming(-4, { duration: 45 }),
          withTiming(4, { duration: 45 }),
          withTiming(0, { duration: 45 }),
        ),
      );
    }
    prevErrorRef.current = error;
  }, [error, reducedMotion, shakeX]);

  const animatedInputStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusProgress.get(),
      [0, 1],
      [Colors.light.border, Colors.light.primary],
    ),
    backgroundColor: interpolateColor(
      focusProgress.get(),
      [0, 1],
      [Colors.light.backgroundElement, Colors.light.card],
    ),
    transform: [{ translateX: shakeX.get() }],
  }));

  const handleFocus = () => {
    if (reducedMotion) {
      focusProgress.set(1);
    } else {
      focusProgress.set(withTiming(1, { duration: MotionDurations.fast }));
    }
  };

  const handleBlur = () => {
    if (reducedMotion) {
      focusProgress.set(0);
    } else {
      focusProgress.set(withTiming(0, { duration: MotionDurations.fast }));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {showCounter && typeof maxLength === 'number' ? (
          <Text style={styles.counter}>
            {value.length}/{maxLength}
          </Text>
        ) : null}
      </View>

      <AnimatedTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.light.textSecondary}
        multiline={multiline}
        maxLength={maxLength}
        editable={editable}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={[
          styles.input,
          animatedInputStyle,
          multiline && styles.multiline,
          !editable && styles.inputDisabled,
          error ? styles.inputError : null,
        ]}
      />
      {error ? (
        <EnterView distance={4}>
          <Text style={styles.error}>{error}</Text>
        </EnterView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 7,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  label: {
    fontFamily: Fonts.sansSemiBold,
    color: Colors.light.text,
    fontSize: 13,
    includeFontPadding: false,
  },
  counter: {
    fontFamily: Fonts.sansMedium,
    color: Colors.light.textSecondary,
    fontSize: 11.5,
    includeFontPadding: false,
  },
  input: {
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: Radii.md,
    backgroundColor: Colors.light.backgroundElement,
    fontFamily: Fonts.sans,
    color: Colors.light.text,
    fontSize: 14.5,
  },
  multiline: {
    minHeight: 124,
    textAlignVertical: 'top',
  },
  inputDisabled: {
    opacity: 0.65,
  },
  inputError: {
    borderColor: Colors.light.danger,
    backgroundColor: Colors.light.card,
  },
  error: {
    fontFamily: Fonts.sansMedium,
    color: Colors.light.danger,
    fontSize: 12,
  },
});