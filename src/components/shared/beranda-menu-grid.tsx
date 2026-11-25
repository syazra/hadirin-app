import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { EnterView, PopBadge, PressableScale } from '@/components/ui/motion';
import { getStaggerDelay } from '@/constants/motion';
import { Colors, Fonts, Shadows } from '@/constants/theme';

export interface BerandaMenuItem {
  key: string;
  label: string;
  bgTint: string;
  badge?: number;
  icon: ReactNode;
  onPress: () => void;
}

export interface BerandaMenuGridProps {
  title?: string;
  items: readonly BerandaMenuItem[];
  columns?: 3 | 4;
}

export function BerandaMenuGrid({
  title = 'Menu',
  items,
  columns = 3,
}: BerandaMenuGridProps) {
  const isFourCols = columns === 4;

  return (
    <View style={styles.menuSection}>
      <Text style={styles.sectionHeading}>{title}</Text>
      <View
        style={[
          styles.menuGrid,
          isFourCols ? styles.menuGridFour : styles.menuGridThree,
        ]}
      >
        {items.map((item, index) => (
          <EnterView
            key={item.key}
            delay={getStaggerDelay(index, 110)}
            distance={12}
            scaleFrom={0.95}
            style={isFourCols ? styles.menuItemFour : styles.menuItemThree}
          >
            <PressableScale
              style={styles.menuPressable}
              scaleTo={0.92}
              onPress={item.onPress}
            >
              <View
                style={[
                  isFourCols ? styles.menuIconBoxFour : styles.menuIconBoxThree,
                  { backgroundColor: item.bgTint },
                ]}
              >
                {item.icon}
                {item.badge && item.badge > 0 ? (
                  <PopBadge triggerKey={item.badge} style={styles.menuBadge}>
                    <Text style={styles.menuBadgeText}>{item.badge}</Text>
                  </PopBadge>
                ) : null}
              </View>
              <Text
                style={isFourCols ? styles.menuLabelFour : styles.menuLabelThree}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </PressableScale>
          </EnterView>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  menuSection: {
    gap: 14,
  },
  sectionHeading: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    lineHeight: 20,
    color: Colors.light.text,
  },
  menuGrid: {
    flexDirection: 'row',
  },
  menuGridThree: {
    flexWrap: 'wrap',
    rowGap: 18,
  },
  menuGridFour: {
    justifyContent: 'space-between',
  },
  menuItemThree: {
    width: '33.33%',
    alignItems: 'center',
  },
  menuItemFour: {
    width: '23%',
    alignItems: 'center',
  },
  menuPressable: {
    alignItems: 'center',
    width: '100%',
  },
  menuIconBoxThree: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(28, 25, 41, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
    ...Shadows.subtle,
  },
  menuIconBoxFour: {
    width: 60,
    height: 60,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(28, 25, 41, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
    ...Shadows.subtle,
  },
  menuBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.light.accent,
    borderWidth: 2,
    borderColor: Colors.light.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  menuBadgeText: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    lineHeight: 13,
    color: Colors.light.card,
  },
  menuLabelThree: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12.5,
    lineHeight: 16,
    color: Colors.light.text,
    textAlign: 'center',
  },
  menuLabelFour: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.light.text,
    textAlign: 'center',
  },
});
