import { Link, Redirect } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { simpanRememberMe } from '@/services/remember-me-service';

import { FormLogin } from '@/components/auth/form-login';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { masuk } from '@/services/auth-service';

export default function LoginScreen() {
  const { profilBelumLengkap, error: errorAuth } = useAuth();
  const [pesan, setPesan] = useState<string | null>(null);
  const [mengirim, setMengirim] = useState(false);

  if (profilBelumLengkap) return <Redirect href="/(auth)/daftar" />;

  async function handleMasuk(email: string, password: string, rememberMe: boolean,) {
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

  function handleLupaPassword() {
    Alert.alert(
      'Reset Password',
      'Hubungi koordinator asisten praktikum atau gunakan fitur reset password melalui email kampus UNDIP Anda.'
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.heading}>
            <View style={styles.logoWrapper}>
              <Image
                source={require('../../../assets/images/hadirin/logo.png')}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>

            <Text accessibilityRole="header" style={styles.title}>
              <Text style={styles.titleBlue}>Masuk ke </Text>
              <Text style={styles.titlePink}>HADIR.IN</Text>
            </Text>
          </View>

          <FormLogin
            error={pesan ?? errorAuth}
            loading={mengirim}
            onForgotPassword={handleLupaPassword}
            onSubmit={handleMasuk}
          />

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Belum punya akun?</Text>
            <Link href="/(auth)/daftar" style={styles.registerLink}>
              Daftar
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: Colors.light.background },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  heading: {
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  logoWrapper: {
    width: 96,
    height: 96,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: Colors.light.primarySoft,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontFamily: Fonts.sansBold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  titleBlue: {
    color: Colors.light.primary,
  },
  titlePink: {
    color: Colors.light.accent,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  registerText: {
    fontFamily: Fonts.sans,
    color: Colors.light.textSecondary,
    fontSize: 14,
  },
  registerLink: {
    fontFamily: Fonts.sansMedium,
    color: Colors.light.primary,
    fontSize: 14,
  },
});