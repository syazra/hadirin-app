import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { FormDaftar } from '@/components/auth/form-daftar';
import { AppButton } from '@/components/ui/app-button';
import { EnterView } from '@/components/ui/motion';
import { Colors, Fonts, Radii, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { daftar, lengkapiProfil } from '@/services/auth-service';
import { validasiIdentitas } from '@/utils/validasi-form';

export default function DaftarScreen() {
  const { muatUlangProfil, profilBelumLengkap } = useAuth();
  const [nama, setNama] = useState('');
  const [nim, setNim] = useState('');
  const [focusedField, setFocusedField] = useState<'nama' | 'nim' | null>(null);
  const [pesanError, setPesanError] = useState<string | null>(null);
  const [mengirim, setMengirim] = useState(false);

  const reducedMotion = useReducedMotion();
  const orbDrift = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      cancelAnimation(orbDrift);
      orbDrift.set(0);
      return;
    }

    orbDrift.set(0);
    orbDrift.set(
      withRepeat(
        withTiming(1, { duration: 6500, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );

    return () => {
      cancelAnimation(orbDrift);
    };
  }, [orbDrift, reducedMotion]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(orbDrift.get(), [0, 1], [-8, 8]) },
      { translateY: interpolate(orbDrift.get(), [0, 1], [6, -6]) },
    ],
  }));

  async function handleDaftar(input: {
    nama: string;
    nim: string;
    email: string;
    password: string;
  }) {
    setPesanError(null);
    setMengirim(true);

    try {
      const hasil = await daftar(input);

      if (!hasil.ok) {
        setPesanError(hasil.pesan);
      } else {
        await muatUlangProfil();
      }
    } catch (error) {
      setPesanError(
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan saat membuat akun.',
      );
    } finally {
      setMengirim(false);
    }
  }

  async function handlePulihkanProfil() {
    setPesanError(null);
    const kesalahan = validasiIdentitas({ nama, nim });
    if (kesalahan) {
      setPesanError(kesalahan);
      return;
    }

    setMengirim(true);
    try {
      const hasil = await lengkapiProfil({ nama, nim });
      if (!hasil.ok) {
        setPesanError(hasil.pesan);
        return;
      }
      await muatUlangProfil();
    } catch (error) {
      setPesanError(
        error instanceof Error ? error.message : 'Gagal memulihkan profil.',
      );
    } finally {
      setMengirim(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.ambientTop} pointerEvents="none">
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 400 260"
          preserveAspectRatio="none"
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            <LinearGradient id="daftar-aura" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#EEF1FF" stopOpacity={0.95} />
              <Stop offset="55%" stopColor="#FFF0F6" stopOpacity={0.75} />
              <Stop offset="100%" stopColor="#F8F6F3" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={400} height={260} fill="url(#daftar-aura)" />
        </Svg>

        <Animated.View style={[StyleSheet.absoluteFill, orbStyle]}>
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 400 260"
            preserveAspectRatio="xMidYMid slice"
          >
            <Circle cx={340} cy={40} r={80} fill="#7C5CFA" fillOpacity={0.07} />
            <Circle cx={50} cy={90} r={64} fill="#EB5B97" fillOpacity={0.07} />
          </Svg>
        </Animated.View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <EnterView delay={0} scaleFrom={0.94}>
            <View style={styles.heading}>
              {profilBelumLengkap ? (
                <>
                  <Text accessibilityRole="header" style={styles.titleCenter}>
                    <Text style={styles.titleBlue}>Pulihkan </Text>
                    <Text style={styles.titlePink}>profil</Text>
                  </Text>
                  <Text style={styles.helper}>
                    Lengkapi identitas akun praktikan Anda.
                  </Text>
                </>
              ) : (
                <View style={styles.headerRow}>
                  <View style={styles.logoWrapper}>
                    <Image
                      source={require('../../../assets/images/hadirin/logo.png')}
                      style={styles.logoImage}
                      resizeMode="cover"
                    />
                  </View>

                  <View style={styles.titleColumn}>
                    <Text accessibilityRole="header" style={styles.titleLeft}>
                      <Text style={styles.titleBlue}>Daftar </Text>
                      <Text style={styles.titlePink}>PRAKTIKAN</Text>
                    </Text>
                    <Text style={styles.tagline}>
                      Buat akun baru untuk presensi lab
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </EnterView>

          <EnterView delay={90}>
            <View style={styles.formCard}>
              {profilBelumLengkap ? (
                <View style={styles.form}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Nama lengkap</Text>
                    <TextInput
                      accessibilityLabel="Nama lengkap"
                      autoCapitalize="words"
                      editable={!mengirim}
                      onFocus={() => setFocusedField('nama')}
                      onBlur={() => setFocusedField((prev) => (prev === 'nama' ? null : prev))}
                      onChangeText={setNama}
                      placeholder="Masukkan nama lengkap"
                      placeholderTextColor={Colors.light.textSecondary}
                      style={[
                        styles.input,
                        focusedField === 'nama' && styles.inputFocused,
                      ]}
                      value={nama}
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>NIM</Text>
                    <TextInput
                      accessibilityLabel="NIM"
                      autoCapitalize="characters"
                      editable={!mengirim}
                      keyboardType="number-pad"
                      onFocus={() => setFocusedField('nim')}
                      onBlur={() => setFocusedField((prev) => (prev === 'nim' ? null : prev))}
                      onChangeText={setNim}
                      placeholder="Contoh: 24060124150001"
                      placeholderTextColor={Colors.light.textSecondary}
                      style={[
                        styles.input,
                        focusedField === 'nim' && styles.inputFocused,
                      ]}
                      value={nim}
                    />
                  </View>

                  {!!pesanError && (
                    <Text accessibilityRole="alert" style={styles.error}>
                      {pesanError}
                    </Text>
                  )}

                  <AppButton
                    fullWidth
                    loading={mengirim}
                    onPress={handlePulihkanProfil}
                    title="Simpan dan lanjutkan"
                  />
                </View>
              ) : (
                <FormDaftar
                  error={pesanError}
                  loading={mengirim}
                  onSubmit={handleDaftar}
                />
              )}
            </View>
          </EnterView>

          {!profilBelumLengkap && (
            <EnterView delay={160}>
              <View style={styles.login}>
                <Text style={styles.helper}>Sudah punya akun?</Text>
                <Link href="/(auth)/login" style={styles.link}>
                  Masuk sekarang
                </Link>
              </View>
            </EnterView>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: Colors.light.background,
    position: 'relative',
  },
  ambientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three + 2,
  },
  heading: {
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  logoWrapper: {
    width: 64,
    height: 64,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: Colors.light.primarySoft,
    ...Shadows.primaryGlow,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  titleColumn: {
    flex: 1,
    gap: 2,
  },
  titleLeft: {
    fontFamily: Fonts.sansBold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.6,
  },
  titleCenter: {
    fontFamily: Fonts.sansBold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  titleBlue: {
    color: Colors.light.primary,
  },
  titlePink: {
    color: Colors.light.accent,
  },
  tagline: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.textSecondary,
  },
  helper: {
    fontFamily: Fonts.sans,
    color: Colors.light.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.card,
  },
  form: {
    gap: Spacing.two + 4,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.light.text,
  },
  input: {
    minHeight: 50,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.three,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundElement,
    fontFamily: Fonts.sans,
    fontSize: 15,
  },
  inputFocused: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.card,
  },
  error: {
    fontFamily: Fonts.sansMedium,
    color: Colors.light.danger,
    fontSize: 13,
    lineHeight: 19,
  },
  login: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: Spacing.one + 2,
    marginTop: Spacing.one,
  },
  link: {
    fontFamily: Fonts.sansBold,
    color: Colors.light.primary,
    fontSize: 14,
    lineHeight: 20,
  },
});
