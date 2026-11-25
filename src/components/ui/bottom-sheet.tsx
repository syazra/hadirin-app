import { type ReactNode, useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {
  GestureDetector,
  GestureHandlerRootView,
  usePanGesture,
} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { MotionSprings } from '@/constants/motion';
import { Colors, Shadows } from '@/constants/theme';

const SHEET_HIDDEN_OFFSET = 420;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type BottomSheetProps = {
  visible: boolean;
  onTutup: () => void;
  /** true saat proses simpan berjalan: backdrop dan tombol Back dikunci. */
  nonaktifTutup?: boolean;
  /** Dipanggil setelah Modal tampil di layar (cocok untuk fokus input). */
  onSetelahTampil?: () => void;
  /** Aktifkan KeyboardAvoidingView untuk sheet yang memiliki TextInput. */
  denganKeyboard?: boolean;
  accessibilityLabelTutup?: string;
  children: ReactNode;
};

export function BottomSheet({
  visible,
  onTutup,
  nonaktifTutup = false,
  onSetelahTampil,
  denganKeyboard = false,
  accessibilityLabelTutup = 'Tutup sheet',
  children,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const [modalVisible, setModalVisible] = useState(visible);
  const [prevVisible, setPrevVisible] = useState(visible);

  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setModalVisible(true);
    } else if (reducedMotion) {
      setModalVisible(false);
    }
  }

  const translateY = useSharedValue(visible ? 0 : SHEET_HIDDEN_OFFSET);
  const backdrop = useSharedValue(visible ? 1 : 0);

  const finishClose = useCallback(() => {
    setModalVisible(false);
  }, []);

  useEffect(() => {
    cancelAnimation(translateY);
    cancelAnimation(backdrop);

    if (visible) {
      if (reducedMotion) {
        translateY.set(0);
        backdrop.set(1);
        return;
      }

      translateY.set(SHEET_HIDDEN_OFFSET);
      backdrop.set(0);
      translateY.set(withSpring(0, MotionSprings.gentle));
      backdrop.set(withTiming(1, { duration: 220 }));
      return;
    }

    if (!modalVisible) {
      return;
    }

    if (reducedMotion) {
      translateY.set(SHEET_HIDDEN_OFFSET);
      backdrop.set(0);
      return;
    }

    backdrop.set(withTiming(0, { duration: 180 }));
    translateY.set(
      withTiming(
        SHEET_HIDDEN_OFFSET,
        { duration: 200, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) {
            scheduleOnRN(finishClose);
          }
        },
      ),
    );
  }, [backdrop, finishClose, modalVisible, reducedMotion, translateY, visible]);

  const tutup = useCallback(() => {
    if (!nonaktifTutup) {
      onTutup();
    }
  }, [nonaktifTutup, onTutup]);

  const panGesture = usePanGesture({
    enabled: !nonaktifTutup,
    activeOffsetY: [-8, 8],
    onUpdate: (event) => {
      'worklet';
      if (event.translationY >= 0) {
        translateY.set(event.translationY);
        backdrop.set(
          interpolate(
            event.translationY,
            [0, 260],
            [1, 0.2],
            Extrapolation.CLAMP,
          ),
        );
      } else {
        translateY.set(Math.max(event.translationY * 0.15, -18));
      }
    },
    onDeactivate: (event) => {
      'worklet';
      if (event.translationY > 95 || event.velocityY > 650) {
        scheduleOnRN(tutup);
      } else {
        translateY.set(withSpring(0, MotionSprings.gentle));
        backdrop.set(withTiming(1, { duration: 180 }));
      }
    },
  });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.get() * 0.45,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.get() }],
  }));

  const konten = (
    <View style={styles.overlay}>
      <AnimatedPressable
        style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}
        onPress={tutup}
        disabled={nonaktifTutup}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabelTutup}
        accessibilityState={{ disabled: nonaktifTutup }}
      />

      <Animated.View
        style={[
          styles.sheet,
          {
            paddingBottom: Math.max(insets.bottom, 16) + 12,
          },
          sheetAnimatedStyle,
        ]}
        accessibilityViewIsModal
      >
        <GestureDetector gesture={panGesture}>
          <View style={styles.handleZone}>
            <View style={styles.handle} />
          </View>
        </GestureDetector>
        {children}
      </Animated.View>
    </View>
  );

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onShow={onSetelahTampil}
      onRequestClose={tutup}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={styles.overlay}>
        {denganKeyboard ? (
          <KeyboardAvoidingView
            style={styles.overlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {konten}
          </KeyboardAvoidingView>
        ) : (
          konten
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  backdrop: {
    backgroundColor: Colors.light.overlay,
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: Colors.light.card,
    paddingHorizontal: 24,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    ...Shadows.elevated,
  },
  handleZone: {
    paddingTop: 12,
    paddingBottom: 18,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#DDD5CC',
  },
});
