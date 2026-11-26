import { useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polyline } from 'react-native-svg';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { IconCheck } from '@/components/ui/icons';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';

export interface DropdownOption {
  value: string;
  label: string;
  subtitle?: string;
  badge?: React.ReactNode;
}

export interface DropdownSelectProps {
  label: string;
  placeholder: string;
  sheetTitle: string;
  options: DropdownOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  disabled?: boolean;
  emptyText?: string;
}

export function DropdownSelect({
  label,
  placeholder,
  sheetTitle,
  options,
  selectedValue,
  onSelect,
  disabled = false,
  emptyText = 'Tidak ada pilihan tersedia.',
}: DropdownSelectProps) {
  const [terbuka, setTerbuka] = useState(false);
  const insets = useSafeAreaInsets();

  const opsiTerpilih = options.find((item) => item.value === selectedValue);

  return (
    <>
      <View style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        <Pressable
          onPress={() => {
            if (!disabled) setTerbuka(true);
          }}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={label}
          style={({ pressed }) => [
            styles.trigger,
            disabled && styles.triggerDisabled,
            pressed && !disabled && styles.triggerPressed,
          ]}
        >
          <View style={styles.triggerTextWrap}>
            <Text
              style={[
                styles.triggerValue,
                !opsiTerpilih && styles.triggerPlaceholder,
              ]}
              numberOfLines={1}
            >
              {opsiTerpilih ? opsiTerpilih.label : placeholder}
            </Text>
            {opsiTerpilih?.subtitle ? (
              <Text style={styles.triggerSubtitle} numberOfLines={1}>
                {opsiTerpilih.subtitle}
              </Text>
            ) : null}
          </View>

          {opsiTerpilih?.badge ? (
            <View style={styles.triggerBadge}>{opsiTerpilih.badge}</View>
          ) : null}

          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Polyline
              points="6 9 12 15 18 9"
              stroke={
                disabled ? Colors.light.textSecondary : Colors.light.text
              }
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>
      </View>

      <BottomSheet
        visible={terbuka}
        onTutup={() => setTerbuka(false)}
        accessibilityLabelTutup={`Tutup ${sheetTitle}`}
      >
        <View style={styles.sheetContainer}>
          <Text style={styles.sheetTitle}>{sheetTitle}</Text>

          {options.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>{emptyText}</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.optionsScroll}
              contentContainerStyle={[
                styles.optionsList,
                { paddingBottom: 12 + insets.bottom },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {options.map((item) => {
                const aktif = item.value === selectedValue;
                return (
                  <Pressable
                    key={item.value}
                    onPress={() => {
                      onSelect(item.value);
                      setTerbuka(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: aktif }}
                    style={({ pressed }) => [
                      styles.optionRow,
                      aktif && styles.optionRowAktif,
                      pressed && styles.optionRowPressed,
                    ]}
                  >
                    <View style={styles.optionTextWrap}>
                      <Text
                        style={[
                          styles.optionLabel,
                          aktif && styles.optionLabelAktif,
                        ]}
                        numberOfLines={2}
                      >
                        {item.label}
                      </Text>
                      {item.subtitle ? (
                        <Text style={styles.optionSubtitle} numberOfLines={1}>
                          {item.subtitle}
                        </Text>
                      ) : null}
                    </View>

                    {item.badge ? <View>{item.badge}</View> : null}

                    {aktif ? (
                      <View style={styles.checkCircle}>
                        <IconCheck size={14} color="#FFFFFF" strokeWidth={2.5} />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  label: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radii.md + 2,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    ...Shadows.subtle,
  },
  triggerDisabled: {
    opacity: 0.6,
    backgroundColor: Colors.light.backgroundElement,
  },
  triggerPressed: {
    opacity: 0.85,
  },
  triggerTextWrap: {
    flex: 1,
    gap: 2,
  },
  triggerValue: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: Colors.light.text,
  },
  triggerPlaceholder: {
    color: Colors.light.textSecondary,
    fontFamily: Fonts.sans,
  },
  triggerSubtitle: {
    fontFamily: Fonts.sans,
    fontSize: 11.5,
    color: Colors.light.textSecondary,
  },
  triggerBadge: {
    flexShrink: 0,
  },
  sheetContainer: {
    gap: 12,
    maxHeight: 460,
  },
  sheetTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 18,
    color: Colors.light.text,
  },
  emptyBox: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: Fonts.sans,
    fontSize: 13.5,
    color: Colors.light.textSecondary,
  },
  optionsScroll: {
    flexGrow: 0,
  },
  optionsList: {
    gap: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Radii.md + 2,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundElement,
  },
  optionRowAktif: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primarySoft,
  },
  optionRowPressed: {
    opacity: 0.85,
  },
  optionTextWrap: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: Colors.light.text,
  },
  optionLabelAktif: {
    color: Colors.light.primary,
  },
  optionSubtitle: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});