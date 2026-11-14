
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
import { daftar } from '@/services/auth-service';

export default function DaftarScreen() {
    const [nama, setNama] = useState('');
    const [nim, setNim] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [pesanError, setPesanError] = useState<string | null>(null);
    const [mengirim, setMengirim] = useState(false);

    async function handleDaftar() {
        setPesanError(null);

        const namaBersih = nama.trim();
        const nimBersih = nim.trim();
        const emailBersih = email.trim();

        if (!namaBersih || !nimBersih || !emailBersih || !password) {
            setPesanError('Semua kolom wajib diisi.');
            return;
        }

        if (namaBersih.length > 100) {
            setPesanError('Nama maksimal 100 karakter.');
            return;
        }

        if (nimBersih.length > 32) {
            setPesanError('NIM maksimal 32 karakter.');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailBersih)) {
            setPesanError('Format email tidak valid.');
            return;
        }

        if (password.length < 6) {
            setPesanError('Kata sandi minimal 6 karakter.');
            return;
        }

        setMengirim(true);

        try {
            const hasil = await daftar({
                nama: namaBersih,
                nim: nimBersih,
                email: emailBersih,
                password,
            });

            if (!hasil.ok) {
                setPesanError(hasil.pesan);
            }
            // Jika berhasil, Firebase Auth akan memperbarui
            // status autentikasi dan AuthContext menangani navigasi.
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
                        <Text style={styles.brand}>Hadir.in</Text>

                        <Text
                            accessibilityRole="header"
                            style={styles.title}
                        >
                            Buat akun Praktikan
                        </Text>

                        <Text style={styles.helper}>
                            Daftarkan identitasmu untuk mulai menggunakan
                            aplikasi Hadir.in.
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <Text style={styles.label}>Nama lengkap</Text>
                        <TextInput
                            accessibilityLabel="Nama lengkap"
                            autoCapitalize="words"
                            autoComplete="name"
                            editable={!mengirim}
                            onChangeText={setNama}
                            placeholder="Masukkan nama lengkap"
                            placeholderTextColor={Colors.light.textSecondary}
                            returnKeyType="next"
                            style={styles.input}
                            value={nama}
                        />

                        <Text style={styles.label}>NIM</Text>
                        <TextInput
                            accessibilityLabel="NIM"
                            autoCapitalize="characters"
                            editable={!mengirim}
                            onChangeText={setNim}
                            placeholder="Masukkan NIM"
                            placeholderTextColor={Colors.light.textSecondary}
                            returnKeyType="next"
                            style={styles.input}
                            value={nim}
                        />

                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            accessibilityLabel="Email"
                            autoCapitalize="none"
                            autoComplete="email"
                            editable={!mengirim}
                            keyboardType="email-address"
                            onChangeText={setEmail}
                            placeholder="nama@email.com"
                            placeholderTextColor={Colors.light.textSecondary}
                            returnKeyType="next"
                            style={styles.input}
                            textContentType="emailAddress"
                            value={email}
                        />

                        <Text style={styles.label}>Kata sandi</Text>
                        <TextInput
                            accessibilityLabel="Kata sandi"
                            autoCapitalize="none"
                            autoComplete="new-password"
                            editable={!mengirim}
                            onChangeText={setPassword}
                            placeholder="Minimal 6 karakter"
                            placeholderTextColor={Colors.light.textSecondary}
                            returnKeyType="done"
                            secureTextEntry
                            style={styles.input}
                            textContentType="newPassword"
                            value={password}
                        />

                        {pesanError && (
                            <Text
                                accessibilityRole="alert"
                                style={styles.error}
                            >
                                {pesanError}
                            </Text>
                        )}

                        <AppButton
                            fullWidth
                            loading={mengirim}
                            onPress={handleDaftar}
                            title="Daftar"
                        />
                    </View>

                    <View style={styles.login}>
                        <Text style={styles.helper}>
                            Sudah punya akun?
                        </Text>
                        <Link
                            href="/(auth)/login"
                            style={styles.link}
                        >
                            Masuk sekarang
                        </Link>
                    </View>
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
    },
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
        gap: Spacing.two,
        marginBottom: Spacing.two,
    },
    brand: {
        color: Colors.light.primary,
        fontSize: 28,
        fontWeight: '800',
    },
    title: {
        color: Colors.light.text,
        fontSize: 23,
        fontWeight: '700',
    },
    helper: {
        color: Colors.light.textSecondary,
        fontSize: 14,
        lineHeight: 21,
    },
    form: {
        gap: Spacing.two,
    },
    label: {
        color: Colors.light.text,
        fontSize: 14,
        fontWeight: '600',
    },
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
    error: {
        color: Colors.light.danger,
        fontSize: 14,
        lineHeight: 20,
    },
    login: {
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
