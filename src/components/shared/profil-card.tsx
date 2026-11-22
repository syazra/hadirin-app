import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Svg, { Path, Polyline, Rect } from 'react-native-svg';

import { Colors, Fonts, Spacing } from '@/constants/theme';
import { keluar } from '@/services/auth-service';
import type { Pengguna } from '@/types';

interface ProfilCardProps {
  pengguna: Pengguna;
}

function CopyIcon({ color }: { color: string }) {
  return (
    <Svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Rect x={9} y={9} width={13} height={13} rx={2} ry={2} />
      <Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </Svg>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <Svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Polyline points="20 6 9 17 4 12" />
    </Svg>
  );
}

function LogoutDoorIcon({ color }: { color: string }) {
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <Polyline points="16 17 21 12 16 7" />
      <Path d="M21 12H9" />
    </Svg>
  );
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
        setPesan('Kode pengguna berhasil disalin.');
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
      {/* Card 1: Lingkaran inisial, Nama lengkap, Email (center semua) */}
      <View style={styles.heroCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{inisial}</Text>
        </View>

        <Text accessibilityRole="header" style={styles.namaText}>
          {namaLengkap}
        </Text>
        <Text style={styles.emailText}>{pengguna.email}</Text>
      </View>

      {/* Card 2: Role, NIM, dan Kode pengguna + Salin kode pengguna */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Role</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{labelRole}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoColumn}>
          <Text style={styles.infoLabel}>NIM</Text>
          <Text selectable style={styles.infoValue}>
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

          <Pressable
            accessibilityLabel="Salin kode pengguna"
            accessibilityRole="button"
            disabled={menyalin}
            onPress={salinKode}
            style={({ pressed }) => [
              styles.copyButton,
              menyalin && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            {tersalin ? (
              <CheckIcon color={Colors.light.primary} />
            ) : (
              <CopyIcon color={Colors.light.primary} />
            )}
            <Text style={styles.copyButtonText}>
              {tersalin ? 'Tersalin' : 'Salin kode'}
            </Text>
          </Pressable>
        </View>

        {!!pesan && (
          <Text accessibilityRole="alert" style={styles.message}>
            {pesan}
          </Text>
        )}
      </View>

      {/* Tombol Keluar dengan simbol pintu keluar SVG */}
      <Pressable
        accessibilityLabel="Keluar"
        accessibilityRole="button"
        disabled={keluarMemuat}
        onPress={handleKeluar}
        style={({ pressed }) => [
          styles.logoutButton,
          keluarMemuat && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        {keluarMemuat ? (
          <ActivityIndicator size="small" color={Colors.light.danger} />
        ) : (
          <>
            <LogoutDoorIcon color={Colors.light.danger} />
            <Text style={styles.logoutText}>Keluar</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
    wrapper: {
        gap: Spacing.three,
    },
    heroCard: {
        backgroundColor: Colors.light.primary,
        borderRadius: 20,
        paddingVertical: Spacing.four + 4,
        paddingHorizontal: Spacing.four,
        alignItems: 'center',
        gap: 6,
    },
    avatarCircle: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: Colors.light.card,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.one,
    },
    avatarText: {
        fontFamily: Fonts.sansBold,
        fontSize: 34,
        color: Colors.light.primary,
        includeFontPadding: false,
    },
    namaText: {
        fontFamily: Fonts.sansBold,
        fontSize: 20,
        color: Colors.light.card,
        textAlign: 'center',
        includeFontPadding: false,
    },
    emailText: {
        fontFamily: Fonts.sans,
        fontSize: 13,
        color: Colors.light.primarySoft,
        textAlign: 'center',
        includeFontPadding: false,
    },
    infoCard: {
        backgroundColor: Colors.light.card,
        borderWidth: 1.5,
        borderColor: Colors.light.border,
        borderRadius: 20,
        padding: Spacing.four,
        gap: Spacing.three,
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
        fontFamily: Fonts.sans,
        fontSize: 12,
        color: Colors.light.textSecondary,
        includeFontPadding: false,
    },
    infoValue: {
        fontFamily: Fonts.sansMedium,
        fontSize: 15,
        color: Colors.light.text,
        includeFontPadding: false,
    },
    roleBadge: {
        backgroundColor: Colors.light.accentSoft,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 999,
    },
    roleBadgeText: {
        fontFamily: Fonts.sansMedium,
        fontSize: 12,
        color: Colors.light.accent,
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
        fontFamily: Fonts.sansMedium,
        fontSize: 15,
        color: Colors.light.text,
        includeFontPadding: false,
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.light.primarySoft,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
    },
    copyButtonText: {
        fontFamily: Fonts.sansMedium,
        fontSize: 13,
        color: Colors.light.primary,
        includeFontPadding: false,
    },
    message: {
        fontFamily: Fonts.sans,
        color: Colors.light.textSecondary,
        fontSize: 13,
        includeFontPadding: false,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minHeight: 50,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: Colors.light.accent,
        backgroundColor: Colors.light.card,
    },
    logoutText: {
        fontFamily: Fonts.sansMedium,
        fontSize: 15,
        color: Colors.light.danger,
        includeFontPadding: false,
    },
    pressed: {
        opacity: 0.8,
    },
    disabled: {
        opacity: 0.5,
    },
});