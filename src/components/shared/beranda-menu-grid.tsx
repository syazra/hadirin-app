import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

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
        {items.map((item) => (
          <Pressable
            key={item.key}
            style={({ pressed }) => [
              isFourCols ? styles.menuItemFour : styles.menuItemThree,
              pressed && styles.itemPressed,
            ]}
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
                <View style={styles.menuBadge}>
                  <Text style={styles.menuBadgeText}>{item.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text
              style={isFourCols ? styles.menuLabelFour : styles.menuLabelThree}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  menuSection: {
    gap: 16,
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
    rowGap: 20,
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
  menuIconBoxThree: {
    width: 62,
    height: 62,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  menuIconBoxFour: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  menuBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.light.accent,
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
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    lineHeight: 17,
    color: Colors.light.text,
    textAlign: 'center',
  },
  menuLabelFour: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.light.text,
    textAlign: 'center',
  },
  itemPressed: {
    opacity: 0.7,
  },
});