import { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { Colors, Spacing } from '@/constants/theme';
import { validasiLogin } from '@/utils/validasi-form';

interface FormLoginProps {
    error?: string | null;
    loading?: boolean;
    onSubmit: (email: string, password: string) => void | Promise<void>;
}

export function FormLogin({
    error,
    loading = false,
    onSubmit,
}: FormLoginProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorValidasi, setErrorValidasi] = useState<string | null>(null);

    function handleSubmit() {
        const masalah = validasiLogin(email, password);
        if (masalah) {
            setErrorValidasi(masalah);
            return;
        }

        setErrorValidasi(null);
        void onSubmit(email.trim(), password);
    }

    return (
        <View style={styles.form}>
            <TextInput
                accessibilityLabel="Email"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={Colors.light.textSecondary}
                returnKeyType="next"
                style={styles.input}
                textContentType="emailAddress"
                value={email}
            />

            <TextInput
                accessibilityLabel="Kata sandi"
                autoCapitalize="none"
                autoComplete="password"
                editable={!loading}
                onChangeText={setPassword}
                onSubmitEditing={handleSubmit}
                placeholder="Kata sandi"
                placeholderTextColor={Colors.light.textSecondary}
                returnKeyType="done"
                secureTextEntry
                style={styles.input}
                textContentType="password"
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
                title="Masuk"
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
