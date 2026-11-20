import { useState } from 'react';
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
import type { InputDaftar } from '@/services/auth-service';

interface FormDaftarProps {
    error?: string | null;
    loading?: boolean;
    onSubmit: (input: InputDaftar) => void | Promise<void>;
}

interface FieldErrors {
    nama?: string;
    nim?: string;
    email?: string;
    password?: string;
    konfirmasi?: string;
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

export function FormDaftar({
    error,
    loading = false,
    onSubmit,
}: FormDaftarProps) {
    const [nama, setNama] = useState('');
    const [nim, setNim] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [konfirmasi, setKonfirmasi] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showKonfirmasi, setShowKonfirmasi] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    function clearError(field: keyof FieldErrors) {
        if (fieldErrors[field]) {
            setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    }

    function validasiPerKolom(): boolean {
        const errors: FieldErrors = {};

        if (!nama.trim()) {
            errors.nama = 'Nama lengkap wajib diisi.';
        }

        if (!nim.trim()) {
            errors.nim = 'NIM wajib diisi.';
        }

        if (!email.trim()) {
            errors.email = 'Email wajib diisi.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            errors.email = 'Format email tidak valid.';
        }

        if (!password) {
            errors.password = 'Password wajib diisi.';
        } else if (password.length < 6) {
            errors.password = 'Password minimal 6 karakter.';
        }

        if (!konfirmasi) {
            errors.konfirmasi = 'Konfirmasi password wajib diisi.';
        } else if (konfirmasi !== password) {
            errors.konfirmasi = 'Password tidak sama';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }

    function handleSubmit() {
        if (!validasiPerKolom()) return;

        void onSubmit({
            nama: nama.trim(),
            nim: nim.trim(),
            email: email.trim().toLowerCase(),
            password,
        });
    }

    const isEmailServerError = !!error && /email/i.test(error);
    const isNimServerError = !!error && /nim/i.test(error);
    const pesanBawahKonfirmasi = fieldErrors.konfirmasi ?? error;

    return (
        <View style={styles.form}>
            <View style={styles.fieldGroup}>
                <Text style={styles.label}>Nama lengkap</Text>
                <TextInput
                    accessibilityLabel="Nama lengkap"
                    autoCapitalize="words"
                    autoComplete="name"
                    editable={!loading}
                    onChangeText={(text) => {
                        setNama(text);
                        clearError('nama');
                    }}
                    placeholder="Masukkan nama lengkap"
                    placeholderTextColor={Colors.light.textSecondary}
                    returnKeyType="next"
                    style={[styles.input, !!fieldErrors.nama && styles.inputError]}
                    value={nama}
                />
                {!!fieldErrors.nama && (
                    <Text accessibilityRole="alert" style={styles.fieldError}>
                        {fieldErrors.nama}
                    </Text>
                )}
            </View>

            <View style={styles.fieldGroup}>
                <Text style={styles.label}>NIM</Text>
                <TextInput
                    accessibilityLabel="NIM"
                    autoCapitalize="characters"
                    editable={!loading}
                    keyboardType="number-pad"
                    onChangeText={(text) => {
                        setNim(text);
                        clearError('nim');
                    }}
                    placeholder="Contoh: 24060124150001"
                    placeholderTextColor={Colors.light.textSecondary}
                    returnKeyType="next"
                    style={[styles.input, !!(fieldErrors.nim || isNimServerError) && styles.inputError]}
                    value={nim}
                />
                {!!fieldErrors.nim && (
                    <Text accessibilityRole="alert" style={styles.fieldError}>
                        {fieldErrors.nim}
                    </Text>
                )}
            </View>

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
                        clearError('email');
                    }}
                    placeholder="nama@hadirin.test"
                    placeholderTextColor={Colors.light.textSecondary}
                    returnKeyType="next"
                    style={[styles.input, !!(fieldErrors.email || isEmailServerError) && styles.inputError]}
                    textContentType="emailAddress"
                    value={email}
                />
                {!!fieldErrors.email && (
                    <Text accessibilityRole="alert" style={styles.fieldError}>
                        {fieldErrors.email}
                    </Text>
                )}
            </View>

            <View style={styles.fieldGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={[styles.passwordContainer, !!fieldErrors.password && styles.inputError]}>
                    <TextInput
                        accessibilityLabel="Password"
                        autoCapitalize="none"
                        autoComplete="new-password"
                        editable={!loading}
                        onChangeText={(text) => {
                            setPassword(text);
                            clearError('password');
                        }}
                        placeholder="Minimal 6 karakter"
                        placeholderTextColor={Colors.light.textSecondary}
                        returnKeyType="next"
                        secureTextEntry={!showPassword}
                        style={styles.passwordInput}
                        textContentType="newPassword"
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
                {!!fieldErrors.password && (
                    <Text accessibilityRole="alert" style={styles.fieldError}>
                        {fieldErrors.password}
                    </Text>
                )}
            </View>

            <View style={styles.fieldGroup}>
                <Text style={styles.label}>Konfirmasi Password</Text>
                <View style={[styles.passwordContainer, !!fieldErrors.konfirmasi && styles.inputError]}>
                    <TextInput
                        accessibilityLabel="Konfirmasi"
                        autoCapitalize="none"
                        autoComplete="new-password"
                        editable={!loading}
                        onChangeText={(text) => {
                            setKonfirmasi(text);
                            clearError('konfirmasi');
                        }}
                        onSubmitEditing={handleSubmit}
                        placeholder="Ulangi password"
                        placeholderTextColor={Colors.light.textSecondary}
                        returnKeyType="done"
                        secureTextEntry={!showKonfirmasi}
                        style={styles.passwordInput}
                        textContentType="newPassword"
                        value={konfirmasi}
                    />
                    <Pressable
                        accessibilityLabel={showKonfirmasi ? 'Sembunyikan konfirmasi password' : 'Tampilkan konfirmasi password'}
                        hitSlop={8}
                        onPress={() => setShowKonfirmasi((prev) => !prev)}
                        style={styles.eyeButton}
                    >
                        <EyeIcon visible={showKonfirmasi} color={Colors.light.textSecondary} />
                    </Pressable>
                </View>
                {!!pesanBawahKonfirmasi && (
                    <Text accessibilityRole="alert" style={styles.fieldError}>
                        {pesanBawahKonfirmasi}
                    </Text>
                )}
            </View>

            <View style={styles.submitWrapper}>
                <AppButton
                    fullWidth
                    loading={loading}
                    onPress={handleSubmit}
                    title="Buat akun"
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    form: {
        gap: Spacing.two + 2,
    },
    fieldGroup: {
        gap: 6,
    },
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
    submitWrapper: {
        marginTop: Spacing.one,
    },
});