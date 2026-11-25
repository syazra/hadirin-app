import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconArrowLeft } from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/motion';
import { Colors, Fonts, Shadows, Spacing } from '@/constants/theme';

export interface StackHeaderProps {
  navigation: {
    goBack: () => void;
  };
  options: {
    title?: string;
  };
  back?: unknown;
}

/** Shared warm navigation header for Stack screens with tactile back pill. */
export function StackHeader({ navigation, options, back }: StackHeaderProps) {
  const insets = useSafeAreaInsets();
  const headerContentHeight = Platform.OS === 'ios' ? 48 : 60;

  return (
    <View
      style={[
        styles.headerContainer,
        {
          paddingTop: insets.top,
          height: headerContentHeight + insets.top,
        },
      ]}
    >
      {back ? (
        <PressableScale
          onPress={navigation.goBack}
          hitSlop={8}
          scaleTo={0.9}
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          style={styles.backButton}
        >
          <IconArrowLeft size={19} color={Colors.light.text} strokeWidth={2.1} />
        </PressableScale>
      ) : null}
      <Text style={styles.headerTitleLeft} numberOfLines={1}>
        {options.title ?? ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    paddingHorizontal: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.two + 4,
    ...Shadows.subtle,
  },
  headerTitleLeft: {
    flex: 1,
    fontFamily: Fonts.sansBold,
    color: Colors.light.text,
    fontSize: 18,
    letterSpacing: -0.3,
    includeFontPadding: false,
  },
});
