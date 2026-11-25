import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { IconBell } from '@/components/ui/icons';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';
import { useNotifications } from '@/context/notification-context';

export function NotificationSettings() {
  const { status, activate, settings } = useNotifications();
  const [requesting, setRequesting] = useState(false);

  const enable = async () => {
    setRequesting(true);
    try {
      await activate();
    } finally {
      setRequesting(false);
    }
  };

  const statusMeta = {
    UNSUPPORTED: {
      label: 'Android',
      color: Colors.light.textSecondary,
      bg: Colors.light.backgroundElement,
    },
    DISABLED: {
      label: 'Belum aktif',
      color: Colors.light.warning,
      bg: Colors.light.warningSoft,
    },
    REGISTERING: {
      label: 'Menyiapkan…',
      color: Colors.light.primary,
      bg: Colors.light.primarySoft,
    },
    READY: {
      label: 'Aktif',
      color: Colors.light.success,
      bg: Colors.light.successSoft,
    },
    ERROR: {
      label: 'Perlu ulang',
      color: Colors.light.danger,
      bg: Colors.light.dangerSoft,
    },
  }[status];

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <IconBell size={19} color={Colors.light.warm} />
        </View>
        <View style={styles.titleBlock}>
          <Text accessibilityRole="header" style={styles.title}>
            Notifikasi
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            Info sesi dibuka, jadwal, dan status izin
          </Text>
        </View>
        <View
          accessibilityLiveRegion="polite"
          style={[styles.statusPill, { backgroundColor: statusMeta.bg }]}
        >
          <Text style={[styles.statusText, { color: statusMeta.color }]}>
            {statusMeta.label}
          </Text>
        </View>
      </View>

      {status !== 'UNSUPPORTED' && (
        <View style={styles.actions}>
          {status !== 'READY' && (
            <AppButton
              title={status === 'ERROR' ? 'Coba lagi' : 'Aktifkan notifikasi'}
              loading={requesting || status === 'REGISTERING'}
              onPress={() => {
                void enable();
              }}
            />
          )}
          <AppButton
            title="Pengaturan notifikasi"
            variant="outline"
            disabled={requesting}
            onPress={() => {
              void settings();
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
    padding: 18,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    ...Shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: Colors.light.warmSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: Fonts.sansBold,
    fontSize: 15.5,
    color: Colors.light.text,
  },
  body: {
    fontFamily: Fonts.sans,
    fontSize: 12.5,
    lineHeight: 17,
    color: Colors.light.textSecondary,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  statusText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11.5,
  },
  actions: {
    gap: 10,
  },
});
