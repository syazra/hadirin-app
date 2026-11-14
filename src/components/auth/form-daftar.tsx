import { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import type { InputDaftar } from '@/services/auth-service';
import { AppButton } from '@/components/ui/app-button';
import { Colors, Spacing } from '@/constants/theme';
import { validasiRegistrasi } from '@/utils/validasi-form';

interface FormDaftarProps {
    error?: string | null;
    loading?: boolean;
    onSubmit: (input: InputDaftar) => void | Promise<void>;
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
    const [errorValidasi, setErrorValidasi] = useState<string | null>(null);

    function handleSubmit() {
        const input = { nama, nim, email, password };
        const masalah = validasiRegistrasi(input);

        if (masalah) {
            setErrorValidasi(masalah);
            return;
        }

        setErrorValidasi(null);
        void onSubmit({
            nama: nama.trim(),
            nim: nim.trim(),
            email: email.trim().toLowerCase(),
            password,
        });
    }

    return (
        <View style={styles.form}>
            <TextInput
                accessibilityLabel="Nama lengkap"
                autoCapitalize="words"
                autoComplete="name"
                editable={!loading}
                onChangeText={setNama}
                placeholder="Masukkan nama lengkap"
                placeholderTextColor={Colors.light.textSecondary}
                returnKeyType="next"
                style={styles.input}
                value={nama}
            />

            <TextInput
                accessibilityLabel="NIM"
                autoCapitalize="characters"
                editable={!loading}
                onChangeText={setNim}
                placeholder="Masukkan NIM"
                placeholderTextColor={Colors.light.textSecondary}
                returnKeyType="next"
                style={styles.input}
                value={nim}
            />

            <TextInput
                accessibilityLabel="Email"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="nama@email.com"
                placeholderTextColor={Colors.light.textSecondary}
                returnKeyType="next"
                style={styles.input}
                textContentType="emailAddress"
                value={email}
            />

            <TextInput
                accessibilityLabel="Kata sandi"
                autoCapitalize="none"
                autoComplete="new-password"
                editable={!loading}
                onChangeText={setPassword}
                onSubmitEditing={handleSubmit}
                placeholder="Minimal 6 karakter"
                placeholderTextColor={Colors.light.textSecondary}
                returnKeyType="done"
                secureTextEntry
                style={styles.input}
                textContentType="newPassword"
                value={password}
            />

            {!!(errorValidasi || error) && (
                <Text accessibilityRole="alert" style={styles.error}>
                    {errorValidasi ?? error}
                </Text>
            )}

            <AppButton
                fullWidth
                loading={loading}
                onPress={handleSubmit}
                title="Daftar"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    form: { gap: Spacing.two },
    input: {
        minHeight: 50,
        borderWidth: 1,
        borderColor: Colors.light.border,
        borderRadius: 12,
        paddingHorizontal: Spacing.three,
        color: Colors.light.text,
        backgroundColor: Colors.light.card,
        fontSize: 16,
    },
    error: { color: Colors.light.danger, fontSize: 14, lineHeight: 20 },
});
