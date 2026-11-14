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

import { FormDaftar } from '@/components/auth/form-daftar';
import { AppButton } from '@/components/ui/app-button';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { daftar, lengkapiProfil } from '@/services/auth-service';
import { validasiIdentitas } from '@/utils/validasi-form';

export default function DaftarScreen() {
    const { muatUlangProfil, profilBelumLengkap } = useAuth();
    const [nama, setNama] = useState('');
    const [nim, setNim] = useState('');
    const [pesanError, setPesanError] = useState<string | null>(null);
    const [mengirim, setMengirim] = useState(false);

    async function handleDaftar(input: { nama: string; nim: string; email: string; password: string }) {
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
            setPesanError(error instanceof Error ? error.message : 'Gagal memulihkan profil.');
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
                            {profilBelumLengkap ? 'Pulihkan profil' : 'Buat akun Praktikan'}
                        </Text>

                        <Text style={styles.helper}>
                            {profilBelumLengkap
                                ? 'Akun autentikasi sudah ada. Lengkapi identitas tanpa membuat akun baru.'
                                : 'Daftarkan identitasmu untuk mulai menggunakan aplikasi Hadir.in.'}
                        </Text>
                    </View>

                    {profilBelumLengkap ? (
                        <View style={styles.form}>
                            <TextInput accessibilityLabel="Nama lengkap" autoCapitalize="words" editable={!mengirim} onChangeText={setNama} placeholder="Nama lengkap" placeholderTextColor={Colors.light.textSecondary} style={styles.input} value={nama} />
                            <TextInput accessibilityLabel="NIM" autoCapitalize="characters" editable={!mengirim} onChangeText={setNim} placeholder="NIM" placeholderTextColor={Colors.light.textSecondary} style={styles.input} value={nim} />
                            {pesanError && <Text accessibilityRole="alert" style={styles.error}>{pesanError}</Text>}
                            <AppButton fullWidth loading={mengirim} onPress={handlePulihkanProfil} title="Simpan dan lanjutkan" />
                        </View>
                    ) : (
                        <FormDaftar error={pesanError} loading={mengirim} onSubmit={handleDaftar} />
                    )}

                    {!profilBelumLengkap && <View style={styles.login}>
                        <Text style={styles.helper}>
                            Sudah punya akun?
                        </Text>
                        <Link
                            href="/(auth)/login"
                            style={styles.link}
                        >
                            Masuk sekarang
                        </Link>
                    </View>}
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
    form: { gap: Spacing.two },
    input: { minHeight: 50, borderWidth: 1, borderColor: Colors.light.border, borderRadius: 12, paddingHorizontal: Spacing.three, color: Colors.light.text, backgroundColor: Colors.light.card, fontSize: 16 },
    error: { color: Colors.light.danger, fontSize: 14, lineHeight: 20 },
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
