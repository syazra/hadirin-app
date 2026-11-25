import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { IconCheck, IconEye, IconEyeOff } from '@/components/ui/icons';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { ambilRememberMe } from '@/services/remember-me-service';

interface FormLoginProps {
  error?: string | null;
  loading?: boolean;
  onForgotPassword?: () => void;
  onSubmit: (
    email: string,
    password: string,
    rememberMe: boolean,
  ) => void | Promise<void>;
}

export function FormLogin({
  error,
  loading = false,
  onForgotPassword,
  onSubmit,
}: FormLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const [errorEmail, setErrorEmail] = useState<string | null>(null);
  const [errorPassword, setErrorPassword] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [rememberMeSiap, setRememberMeSiap] = useState(false);

  useEffect(() => {
    let masihAktif = true;

    ambilRememberMe()
      .then((nilai) => {
        if (masihAktif) {
          setRememberMe(nilai);
        }
      })
      .catch(() => {
        if (masihAktif) {
          setRememberMe(false);
        }
      })
      .finally(() => {
        if (masihAktif) {
          setRememberMeSiap(true);
        }
      });

    return () => {
      masihAktif = false;
    };
  }, []);

  function validasiPerKolom() {
    const emailBersih = email.trim();
    let pesanEmail: string | null = null;
    let pesanPassword: string | null = null;

    if (!emailBersih) {
      pesanEmail = 'Email wajib diisi.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailBersih)) {
      pesanEmail = 'Format email tidak valid.';
    }

    if (!password) {
      pesanPassword = 'Password wajib diisi.';
    } else if (password.length < 6) {
      pesanPassword = 'Password minimal 6 karakter.';
    }

    setErrorEmail(pesanEmail);
    setErrorPassword(pesanPassword);
    return !pesanEmail && !pesanPassword;
  }

  function handleSubmit() {
    if (!validasiPerKolom()) return;
    void onSubmit(email.trim(), password, rememberMe);
  }

  const pesanBawahPassword = errorPassword ?? error;

  return (
    <View style={styles.form}>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          accessibilityLabel="Email"
          autoCapitalize="none"
          autoComplete="email"
          editable={!loading}
          keyboardType="email-address"
          onFocus={() => setFocusedField('email')}
          onBlur={() => setFocusedField((prev) => (prev === 'email' ? null : prev))}
          onChangeText={(text) => {
            setEmail(text);
            if (errorEmail) setErrorEmail(null);
          }}
          placeholder="nama@hadirin.test"
          placeholderTextColor={Colors.light.textSecondary}
          returnKeyType="next"
          style={[
            styles.input,
            focusedField === 'email' && styles.inputFocused,
            !!(errorEmail || error) && styles.inputError,
          ]}
          textContentType="emailAddress"
          value={email}
        />
        {!!errorEmail && (
          <Text accessibilityRole="alert" style={styles.fieldError}>
            {errorEmail}
          </Text>
        )}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Password</Text>
        <View
          style={[
            styles.passwordContainer,
            focusedField === 'password' && styles.inputFocused,
            !!pesanBawahPassword && styles.inputError,
          ]}
        >
          <TextInput
            accessibilityLabel="Password"
            autoCapitalize="none"
            autoComplete="password"
            editable={!loading}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField((prev) => (prev === 'password' ? null : prev))}
            onChangeText={(text) => {
              setPassword(text);
              if (errorPassword) setErrorPassword(null);
            }}
            onSubmitEditing={handleSubmit}
            placeholder="Masukkan password"
            placeholderTextColor={Colors.light.textSecondary}
            returnKeyType="done"
            secureTextEntry={!showPassword}
            style={styles.passwordInput}
            textContentType="password"
            value={password}
          />
          <Pressable
            accessibilityLabel={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            hitSlop={8}
            onPress={() => setShowPassword((prev) => !prev)}
            style={styles.eyeButton}
          >
            {showPassword ? (
              <IconEyeOff size={20} color={Colors.light.textSecondary} />
            ) : (
              <IconEye size={20} color={Colors.light.textSecondary} />
            )}
          </Pressable>
        </View>
        {!!pesanBawahPassword && (
          <Text accessibilityRole="alert" style={styles.fieldError}>
            {pesanBawahPassword}
          </Text>
        )}
      </View>

      <View style={styles.optionsRow}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel="Remember Me"
          accessibilityState={{
            checked: rememberMe,
            disabled: loading || !rememberMeSiap,
          }}
          disabled={loading || !rememberMeSiap}
          onPress={() => setRememberMe((prev) => !prev)}
          style={styles.rememberButton}
        >
          <View
            style={[
              styles.checkbox,
              rememberMe && styles.checkboxChecked,
            ]}
          >
            {rememberMe ? <IconCheck size={13} color="#FFFFFF" strokeWidth={2.6} /> : null}
          </View>

          <Text style={styles.rememberText}>Ingat saya</Text>
        </Pressable>

        {onForgotPassword && (
          <Pressable
            onPress={onForgotPassword}
            style={styles.forgotButton}
          >
            <Text style={styles.forgotText}>Lupa password?</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.submitWrap}>
        <AppButton
          fullWidth
          loading={loading}
          onPress={handleSubmit}
          title="Masuk"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.two + 4 },
  fieldGroup: { gap: 6 },
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
  passwordContainer: {
    minHeight: 50,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: Radii.md,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.two,
    backgroundColor: Colors.light.backgroundElement,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    minHeight: 48,
    color: Colors.light.text,
    fontFamily: Fonts.sans,
    fontSize: 15,
  },
  eyeButton: {
    padding: 6,
  },
  inputFocused: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.card,
  },
  inputError: {
    borderColor: Colors.light.accent,
    backgroundColor: Colors.light.card,
  },
  fieldError: {
    fontFamily: Fonts.sansMedium,
    color: Colors.light.danger,
    fontSize: 12,
    paddingHorizontal: 4,
  },
  forgotButton: {
    paddingVertical: 4,
  },
  forgotText: {
    fontFamily: Fonts.sansSemiBold,
    color: Colors.light.primary,
    fontSize: 13,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingVertical: 2,
  },
  rememberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundElement,
  },
  checkboxChecked: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  rememberText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.light.text,
  },
  submitWrap: {
    marginTop: 4,
  },
});
