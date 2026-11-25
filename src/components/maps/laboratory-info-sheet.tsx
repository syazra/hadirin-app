import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { LaboratoryActivityList } from '@/components/maps/laboratory-activity-list';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { IconClose, IconCrosshair, IconMapPin } from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/motion';
import { Colors, Fonts, Radii } from '@/constants/theme';
import type { Laboratorium } from '@/types';

type Props = {
  laboratorium: Laboratorium | null;
  onClose: () => void;
};

export default function LaboratoryInfoSheet({ laboratorium, onClose }: Props) {
  const [cachedLab, setCachedLab] = useState<Laboratorium | null>(laboratorium);

  if (laboratorium && laboratorium !== cachedLab) {
    setCachedLab(laboratorium);
  }

  const displayLab = laboratorium ?? cachedLab;

  return (
    <BottomSheet
      visible={Boolean(laboratorium)}
      onTutup={onClose}
      accessibilityLabelTutup="Tutup informasi laboratorium"
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{displayLab?.nama}</Text>
          <Text style={styles.subtitle}>
            {displayLab?.kodeLab} · {displayLab?.lokasiGedung}
          </Text>
        </View>
        <PressableScale
          onPress={onClose}
          hitSlop={10}
          scaleTo={0.9}
          style={styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel="Tutup"
        >
          <IconClose size={18} color={Colors.light.textSecondary} />
        </PressableScale>
      </View>

      {displayLab ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.chipsRow}>
            <View style={styles.infoChip}>
              <IconMapPin size={14} color={Colors.light.teal} />
              <Text style={styles.infoChipText}>{displayLab.lokasiGedung}</Text>
            </View>

            <View style={styles.infoChip}>
              <IconCrosshair size={14} color={Colors.light.warm} />
              <Text style={styles.infoChipText}>
                Radius {displayLab.radiusPresensi} m
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Aktivitas Laboratorium</Text>
          <LaboratoryActivityList labId={displayLab.idLab} />
        </ScrollView>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  headerText: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontFamily: Fonts.sansBold,
    fontSize: 18,
    color: Colors.light.text,
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: 12.5,
    color: Colors.light.textSecondary,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.light.backgroundElement,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.backgroundElement,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.md,
  },
  infoChipText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12.5,
    color: Colors.light.text,
  },
  sectionTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    color: Colors.light.text,
    marginBottom: 10,
  },
});
