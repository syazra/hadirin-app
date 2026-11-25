import { Link, Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
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

import { FormLogin } from '@/components/auth/form-login';
import { EnterView, PressableScale } from '@/components/ui/motion';
import { Colors, Fonts, Radii, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { masuk } from '@/services/auth-service';
import { demoLoginTersedia, masukDemo } from '@/services/demo-login-service';
import { simpanRememberMe } from '@/services/remember-me-service';

type PeranDemo = 'ASISTEN' | 'PRAKTIKAN';

export default function LoginScreen() {
  const { profilBelumLengkap, error: errorAuth } = useAuth();
  const [pesan, setPesan] = useState<string | null>(null);
  const [mengirim, setMengirim] = useState(false);
  const [demoMemuat, setDemoMemuat] = useState<PeranDemo | null>(null);

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

  if (profilBelumLengkap) return <Redirect href="/(auth)/daftar" />;

  async function handleMasuk(email: string, password: string, rememberMe: boolean) {
    setMengirim(true);
    setPesan(null);
    try {
      await simpanRememberMe(rememberMe);
      const hasil = await masuk(email, password);
      if (!hasil.ok) setPesan(hasil.pesan);
    } catch (error) {
      setPesan(
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan saat masuk.',
      );
    } finally {
      setMengirim(false);
    }
  }

  async function handleMasukDemo(peran: PeranDemo) {
    if (mengirim || demoMemuat !== null) return;

    setDemoMemuat(peran);
    setPesan(null);

    try {
      const hasil = await masukDemo(peran);
      if (!hasil.ok) setPesan(hasil.pesan);
    } catch {
      setPesan('Terjadi kesalahan saat masuk menggunakan akun demo.');
    } finally {
      setDemoMemuat(null);
    }
  }

  function handleLupaPassword() {
    Alert.alert(
      'Reset Password',
      'Hubungi koordinator asisten praktikum atau gunakan fitur reset password melalui email kampus UNDIP Anda.',
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.ambientTop} pointerEvents="none">
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 400 280"
          preserveAspectRatio="none"
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            <LinearGradient id="login-aura" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#EEF1FF" stopOpacity={0.95} />
              <Stop offset="55%" stopColor="#FFF0F6" stopOpacity={0.75} />
              <Stop offset="100%" stopColor="#F8F6F3" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={400} height={280} fill="url(#login-aura)" />
        </Svg>

        <Animated.View style={[StyleSheet.absoluteFill, orbStyle]}>
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 400 280"
            preserveAspectRatio="xMidYMid slice"
          >
            <Circle cx={340} cy={45} r={88} fill="#7C5CFA" fillOpacity={0.07} />
            <Circle cx={55} cy={110} r={70} fill="#EB5B97" fillOpacity={0.07} />
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
              <View style={styles.logoWrapper}>
                <Image
                  source={require('../../../assets/images/hadirin/logo.png')}
                  style={styles.logoImage}
                  resizeMode="cover"
                />
              </View>

              <View style={styles.titleBlock}>
                <Text accessibilityRole="header" style={styles.title}>
                  <Text style={styles.titleBlue}>Masuk ke </Text>
                  <Text style={styles.titlePink}>HADIR.IN</Text>
                </Text>
                <Text style={styles.tagline}>
                  Presensi praktikum cepat & praktis
                </Text>
              </View>
            </View>
          </EnterView>

          <EnterView delay={90}>
            <View style={styles.formCard}>
              <FormLogin
                error={pesan ?? errorAuth}
                loading={mengirim || demoMemuat !== null}
                onForgotPassword={handleLupaPassword}
                onSubmit={handleMasuk}
              />
            </View>
          </EnterView>

          <EnterView delay={160}>
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Belum punya akun?</Text>
              <Link href="/(auth)/daftar" style={styles.registerLink}>
                Daftar
              </Link>
            </View>
          </EnterView>

          {demoLoginTersedia && (
            <EnterView delay={210}>
              <View style={styles.demoSection}>
                <Text style={styles.demoLabel}>Akses cepat akun demo</Text>
                <View style={styles.demoButtonsRow}>
                  <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel="Masuk sebagai Asisten"
                    disabled={mengirim || demoMemuat !== null}
                    onPress={() => void handleMasukDemo('ASISTEN')}
                    scaleTo={0.96}
                    style={[
                      styles.demoButton,
                      (mengirim || demoMemuat !== null) &&
                        styles.demoButtonDisabled,
                    ]}
                  >
                    {demoMemuat === 'ASISTEN' ? (
                      <ActivityIndicator color={Colors.light.primary} />
                    ) : (
                      <Text style={styles.demoButtonText}>
                        Masuk sebagai Asisten
                      </Text>
                    )}
                  </PressableScale>

                  <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel="Masuk sebagai Praktikan"
                    disabled={mengirim || demoMemuat !== null}
                    onPress={() => void handleMasukDemo('PRAKTIKAN')}
                    scaleTo={0.96}
                    style={[
                      styles.demoButton,
                      (mengirim || demoMemuat !== null) &&
                        styles.demoButtonDisabled,
                    ]}
                  >
                    {demoMemuat === 'PRAKTIKAN' ? (
                      <ActivityIndicator color={Colors.light.primary} />
                    ) : (
                      <Text style={styles.demoButtonText}>
                        Masuk sebagai Praktikan
                      </Text>
                    )}
                  </PressableScale>
                </View>
              </View>
            </EnterView>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
    height: 280,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three + 4,
  },
  heading: {
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.one,
  },
  logoWrapper: {
    width: 88,
    height: 88,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: Colors.light.primarySoft,
    ...Shadows.primaryGlow,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  titleBlock: {
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontFamily: Fonts.sansBold,
    fontSize: 28,
    lineHeight: 34,
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
    fontSize: 13.5,
    lineHeight: 19,
    color: Colors.light.textSecondary,
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
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one + 2,
    marginTop: Spacing.one,
  },
  registerText: {
    fontFamily: Fonts.sans,
    color: Colors.light.textSecondary,
    fontSize: 14,
  },
  registerLink: {
    fontFamily: Fonts.sansBold,
    color: Colors.light.primary,
    fontSize: 14,
  },
  demoSection: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  demoLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  demoButton: {
    flex: 1,
    minHeight: 56,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  demoButtonText: {
    fontFamily: Fonts.sansBold,
    fontSize: 13.5,
    color: Colors.light.text,
    textAlign: 'center',
  },
  demoButtonPressed: {
    opacity: 0.75,
  },
  demoButtonDisabled: {
    opacity: 0.55,
  },
});
