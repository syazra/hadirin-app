import { Link } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { lengkapiProfil, masuk } from '@/services/auth-service';

export default function LoginScreen() {
    const {
        profilBelumLengkap,
        error: errorAuth,
        muatUlangProfil,
    } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nama, setNama] = useState('');
    const [nim, setNim] = useState('');
    const [pesan, setPesan] = useState<string | null>(null);
    const [mengirim, setMengirim] = useState(false);

    async function handleMasuk() {
        setMengirim(true);
        setPesan(null);

        try {
            const hasil = await masuk(email, password);

            if (!hasil.ok) {
                setPesan(hasil.pesan);

                if (hasil.alasan === 'PROFIL_BELUM_LENGKAP') {
                    await muatUlangProfil();
                }
            }
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

    async function handleLengkapiProfil() {
        setMengirim(true);
        setPesan(null);

        try {
            const hasil = await lengkapiProfil({ nama, nim });

            if (!hasil.ok) {
                setPesan(hasil.pesan);
                return;
            }

            await muatUlangProfil();
        } catch (error) {
            setPesan(
                error instanceof Error
                    ? error.message
                    : 'Gagal melengkapi profil.',
            );
        } finally {
            setMengirim(false);
        }
    }

    return (
        <SafeAreaView style={styles.screen}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.heading}>
                        <Text accessibilityRole="header" style={styles.brand}>
                            Hadir.in
                        </Text>

                        <Text style={styles.title}>
                            {profilBelumLengkap ? 'Pulihkan profil' : 'Masuk ke akun'}
                        </Text>

                        <Text style={styles.helper}>
                            {profilBelumLengkap
                                ? 'Lengkapi identitas untuk melanjutkan menggunakan akunmu.'
                                : 'Masuk menggunakan akun praktikan atau asisten.'}
                        </Text>
                    </View>

                    {profilBelumLengkap ? (
                        <>
                            <TextInput
                                accessibilityLabel="Nama lengkap"
                                autoCapitalize="words"
                                onChangeText={setNama}
                                placeholder="Nama lengkap"
                                placeholderTextColor={Colors.light.textSecondary}
                                style={styles.input}
                                value={nama}
                            />

                            <TextInput
                                accessibilityLabel="NIM"
                                autoCapitalize="characters"
                                onChangeText={setNim}
                                placeholder="NIM"
                                placeholderTextColor={Colors.light.textSecondary}
                                style={styles.input}
                                value={nim}
                            />

                            {!!(pesan || errorAuth) && (
                                <Text accessibilityRole="alert" style={styles.error}>
                                    {pesan ?? errorAuth}
                                </Text>
                            )}

                            <AppButton
                                fullWidth
                                loading={mengirim}
                                onPress={handleLengkapiProfil}
                                title="Simpan dan lanjutkan"
                            />
                        </>
                    ) : (
                        <>
                            <TextInput
                                accessibilityLabel="Email"
                                autoCapitalize="none"
                                autoComplete="email"
                                keyboardType="email-address"
                                onChangeText={setEmail}
                                placeholder="Email"
                                placeholderTextColor={Colors.light.textSecondary}
                                style={styles.input}
                                textContentType="emailAddress"
                                value={email}
                            />

                            <TextInput
                                accessibilityLabel="Kata sandi"
                                autoCapitalize="none"
                                autoComplete="password"
                                onChangeText={setPassword}
                                placeholder="Kata sandi"
                                placeholderTextColor={Colors.light.textSecondary}
                                secureTextEntry
                                style={styles.input}
                                textContentType="password"
                                value={password}
                            />

                            {!!(pesan || errorAuth) && (
                                <Text accessibilityRole="alert" style={styles.error}>
                                    {pesan ?? errorAuth}
                                </Text>
                            )}

                            <AppButton
                                fullWidth
                                loading={mengirim}
                                onPress={handleMasuk}
                                title="Masuk"
                            />

                            <View style={styles.register}>
                                <Text style={styles.helper}>Belum punya akun?</Text>
                                <Link href="/(auth)/daftar" style={styles.link}>
                                    Daftar sekarang
                                </Link>
                            </View>
                        </>
                    )}
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
    heading: { gap: Spacing.two, marginBottom: Spacing.two },
    brand: { color: Colors.light.primary, fontSize: 28, fontWeight: '800' },
    title: { color: Colors.light.text, fontSize: 23, fontWeight: '700' },
    helper: { color: Colors.light.textSecondary, fontSize: 14, lineHeight: 21 },
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
    register: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: Spacing.one,
        marginTop: Spacing.two,
    },
    link: {
        color: Colors.light.primary,
        fontSize: 14,
        fontWeight: '700',
    },
});