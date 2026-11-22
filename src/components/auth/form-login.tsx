import { useEffect, useState } from 'react';
import { ambilRememberMe } from '@/services/remember-me-service';
import {
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { AppButton } from '@/components/ui/app-button';
import { Colors, Fonts, Spacing } from '@/constants/theme';

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

function EyeIcon({ visible, color }: { visible: boolean; color: string }) {
    return visible ? (
        <Svg
            width={22}
            height={22}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <Path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <Path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
            <Path d="M1 1l22 22" />
        </Svg>
    ) : (
        <Svg
            width={22}
            height={22}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <Circle cx={12} cy={12} r={3} />
        </Svg>
    );
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
                    onChangeText={(text) => {
                        setEmail(text);
                        if (errorEmail) setErrorEmail(null);
                    }}
                    placeholder="nama@hadirin.test"
                    placeholderTextColor={Colors.light.textSecondary}
                    returnKeyType="next"
                    style={[styles.input, !!(errorEmail || error) && styles.inputError]}
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
                <View style={[styles.passwordContainer, !!pesanBawahPassword && styles.inputError]}>
                    <TextInput
                        accessibilityLabel="Password"
                        autoCapitalize="none"
                        autoComplete="password"
                        editable={!loading}
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
                        <EyeIcon visible={showPassword} color={Colors.light.textSecondary} />
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
                        {rememberMe && (
                            <Text style={styles.checkboxCheck}>✓</Text>
                        )}
                    </View>

                    <Text style={styles.rememberText}>Remember Me</Text>
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

            <AppButton
                fullWidth
                loading={loading}
                onPress={handleSubmit}
                title="Masuk"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    form: { gap: Spacing.two + 2 },
    fieldGroup: { gap: 6 },
    label: {
        fontFamily: Fonts.sansMedium,
        fontSize: 13,
        color: Colors.light.text,
    },
    input: {
        minHeight: 50,
        borderWidth: 1.5,
        borderColor: Colors.light.border,
        borderRadius: 14,
        paddingHorizontal: Spacing.three,
        color: Colors.light.text,
        backgroundColor: Colors.light.card,
        fontFamily: Fonts.sans,
        fontSize: 15,
    },
    passwordContainer: {
        minHeight: 50,
        borderWidth: 1.5,
        borderColor: Colors.light.border,
        borderRadius: 14,
        paddingLeft: Spacing.three,
        paddingRight: Spacing.two,
        backgroundColor: Colors.light.card,
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
    inputError: {
        borderColor: Colors.light.accent,
    },
    fieldError: {
        fontFamily: Fonts.sans,
        color: Colors.light.danger,
        fontSize: 12,
        paddingHorizontal: 4,
    },
    forgotButton: {
        paddingVertical: 4,
    },
    forgotText: {
        fontFamily: Fonts.sansMedium,
        color: Colors.light.primary,
        fontSize: 13,
    },
    optionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: Spacing.two,
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
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.light.card,
    },
    checkboxChecked: {
        backgroundColor: Colors.light.primary,
        borderColor: Colors.light.primary,
    },
    checkboxCheck: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    rememberText: {
        fontFamily: Fonts.sans,
        fontSize: 13,
        color: Colors.light.text,
    },
});