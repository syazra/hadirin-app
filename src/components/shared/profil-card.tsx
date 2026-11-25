import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { NotificationSettings } from '@/components/shared/notification-settings';
import { BrandGradient } from '@/components/ui/brand-gradient';
import { IconCheck, IconCopy, IconLogout } from '@/components/ui/icons';
import { EnterView, PopBadge, PressableScale } from '@/components/ui/motion';
import { Colors, Fonts, Radii, Shadows, Spacing } from '@/constants/theme';
import { keluar } from '@/services/auth-service';
import type { Pengguna } from '@/types';

interface ProfilCardProps {
  pengguna: Pengguna;
}

export function ProfilCard({ pengguna }: ProfilCardProps) {
  const [menyalin, setMenyalin] = useState(false);
  const [tersalin, setTersalin] = useState(false);
  const [keluarMemuat, setKeluarMemuat] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  const namaLengkap = pengguna.nama.trim() || 'Pengguna Hadir.in';
  const inisial = namaLengkap.charAt(0).toUpperCase();
  const labelRole = pengguna.peran === 'ASISTEN' ? 'Asisten' : 'Praktikan';

  async function salinKode() {
    setMenyalin(true);
    setPesan(null);
    try {
      const berhasil = await Clipboard.setStringAsync(pengguna.kodePeserta);
      if (berhasil) {
        setTersalin(true);
        setPesan('Kode pengguna tersalin.');
        setTimeout(() => setTersalin(false), 2000);
      } else {
        setPesan('Kode pengguna tidak dapat disalin.');
      }
    } catch {
      setPesan('Kode pengguna tidak dapat disalin.');
    } finally {
      setMenyalin(false);
    }
  }

  async function handleKeluar() {
    setKeluarMemuat(true);
    setPesan(null);
    const hasil = await keluar();
    if (!hasil.ok) setPesan(hasil.pesan);
    setKeluarMemuat(false);
  }

  return (
    <View style={styles.wrapper}>
      {/* Hero Card with Brand Gradient + Avatar + Integrated Role Pill */}
      <EnterView delay={0}>
        <BrandGradient variant="brand" style={[styles.heroCard, Shadows.primaryGlow]}>
          <View style={styles.avatarRing}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{inisial}</Text>
            </View>
          </View>

          <Text accessibilityRole="header" style={styles.namaText}>
            {namaLengkap}
          </Text>
          <Text style={styles.emailText}>{pengguna.email}</Text>

          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>{labelRole}</Text>
          </View>
        </BrandGradient>
      </EnterView>

      {/* Info Card: NIM & Kode Pengguna */}
      <EnterView delay={70}>
        <View style={styles.infoCard}>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>NIM</Text>
            <Text selectable style={styles.monoValue}>
              {pengguna.nim}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.kodeColumn}>
              <Text style={styles.infoLabel}>Kode Pengguna</Text>
              <Text selectable style={styles.kodeValue}>
                {pengguna.kodePeserta}
              </Text>
            </View>

            <PressableScale
              accessibilityLabel="Salin kode pengguna"
              accessibilityRole="button"
              disabled={menyalin}
              onPress={salinKode}
              scaleTo={0.94}
              style={[
                styles.copyButton,
                tersalin && styles.copyButtonSuccess,
                menyalin && styles.disabled,
              ]}
            >
              <PopBadge
                triggerKey={tersalin ? 'copied' : 'idle'}
                style={styles.copyBadgeContent}
              >
                {tersalin ? (
                  <IconCheck size={15} color={Colors.light.success} strokeWidth={2.3} />
                ) : (
                  <IconCopy size={15} color={Colors.light.primary} strokeWidth={2} />
                )}
                <Text
                  style={[
                    styles.copyButtonText,
                    tersalin && styles.copyButtonTextSuccess,
                  ]}
                >
                  {tersalin ? 'Tersalin' : 'Salin'}
                </Text>
              </PopBadge>
            </PressableScale>
          </View>

          {!!pesan && (
            <Text accessibilityRole="alert" style={styles.message}>
              {pesan}
            </Text>
          )}
        </View>
      </EnterView>

      <EnterView delay={130}>
        <NotificationSettings />
      </EnterView>

      {/* Tombol Keluar */}
      <EnterView delay={180}>
        <PressableScale
          accessibilityLabel="Keluar"
          accessibilityRole="button"
          disabled={keluarMemuat}
          onPress={handleKeluar}
          scaleTo={0.97}
          style={[
            styles.logoutButton,
            keluarMemuat && styles.disabled,
          ]}
        >
          {keluarMemuat ? (
            <ActivityIndicator size="small" color={Colors.light.danger} />
          ) : (
            <>
              <IconLogout size={19} color={Colors.light.danger} strokeWidth={2} />
              <Text style={styles.logoutText}>Keluar</Text>
            </>
          )}
        </PressableScale>
      </EnterView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.three,
  },
  heroCard: {
    borderRadius: Radii.xl,
    paddingVertical: Spacing.four + 4,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: 6,
  },
  avatarRing: {
    padding: 4,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    marginBottom: 4,
  },
  avatarCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: Colors.light.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Fonts.sansBold,
    fontSize: 32,
    color: Colors.light.primary,
    includeFontPadding: false,
  },
  namaText: {
    fontFamily: Fonts.sansBold,
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    includeFontPadding: false,
  },
  emailText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.86)',
    textAlign: 'center',
    includeFontPadding: false,
  },
  rolePill: {
    marginTop: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  rolePillText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: '#FFFFFF',
    includeFontPadding: false,
  },
  infoCard: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radii.xl,
    padding: 18,
    gap: 14,
    ...Shadows.card,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  infoColumn: {
    gap: 4,
  },
  infoLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.light.textSecondary,
    includeFontPadding: false,
  },
  monoValue: {
    fontFamily: Fonts.mono,
    fontSize: 15,
    color: Colors.light.text,
    includeFontPadding: false,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
  },
  kodeColumn: {
    flex: 1,
    gap: 4,
  },
  kodeValue: {
    fontFamily: Fonts.mono,
    fontSize: 16,
    letterSpacing: 1,
    color: Colors.light.text,
    includeFontPadding: false,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primarySoft,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radii.md,
  },
  copyBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  copyButtonSuccess: {
    backgroundColor: Colors.light.successSoft,
  },
  copyButtonText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.light.primary,
    includeFontPadding: false,
  },
  copyButtonTextSuccess: {
    color: Colors.light.success,
  },
  message: {
    fontFamily: Fonts.sansMedium,
    color: Colors.light.textSecondary,
    fontSize: 12.5,
    includeFontPadding: false,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 50,
    borderRadius: Radii.md + 2,
    borderWidth: 1,
    borderColor: '#FAD0DC',
    backgroundColor: Colors.light.dangerSoft,
    ...Shadows.subtle,
  },
  logoutText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    color: Colors.light.danger,
    includeFontPadding: false,
  },
  disabled: {
    opacity: 0.5,
  },
});
