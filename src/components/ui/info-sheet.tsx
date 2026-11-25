import { StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { IconInfo } from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/motion';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';

type InfoSheetProps = {
  visible: boolean;
  judul: string;
  pesan: string;
  onTutup: () => void;
  labelTutup?: string;
};

export function InfoSheet({
  visible,
  judul,
  pesan,
  onTutup,
  labelTutup = 'Mengerti',
}: InfoSheetProps) {
  return (
    <BottomSheet
      visible={visible}
      onTutup={onTutup}
      accessibilityLabelTutup="Tutup informasi"
    >
      <View style={styles.content}>
        <View style={styles.infoIcon}>
          <IconInfo size={22} color={Colors.light.primary} />
        </View>

        <Text style={styles.title}>{judul}</Text>
        <Text style={styles.message}>{pesan}</Text>

        <PressableScale
          onPress={onTutup}
          accessibilityRole="button"
          accessibilityLabel={labelTutup}
          style={styles.closeButton}
        >
          <Text style={styles.closeText}>{labelTutup}</Text>
        </PressableScale>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
  },
  infoIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.light.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Fonts.sansBold,
    fontSize: 20,
    color: Colors.light.text,
  },
  message: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.light.textSecondary,
    marginBottom: 6,
  },
  closeButton: {
    minHeight: 50,
    borderRadius: Radii.md,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    ...Shadows.primaryGlow,
  },
  closeText: {
    fontFamily: Fonts.sansSemiBold,
    color: '#FFFFFF',
    fontSize: 15,
  },
});
