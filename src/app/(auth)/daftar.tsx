import { Link } from 'expo-router';
import { useState } from 'react';
import {
    Image,
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
import { Colors, Fonts, Spacing } from '@/constants/theme';
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
                        {profilBelumLengkap ? (
                            <>
                                <Text accessibilityRole="header" style={styles.titleCenter}>
                                    <Text style={styles.titleBlue}>Pulihkan </Text>
                                    <Text style={styles.titlePink}>profil</Text>
                                </Text>
                                <Text style={styles.helper}>
                                    Akun autentikasi sudah ada. Lengkapi identitas tanpa membuat akun baru.
                                </Text>
                            </>
                        ) : (
                            <View style={styles.headerRow}>
                                <View style={styles.logoWrapper}>
                                    <Image
                                        source={require('../../../assets/images/hadirin/logo.png')}
                                        style={styles.logoImage}
                                        resizeMode="cover"
                                    />
                                </View>

                                <Text accessibilityRole="header" style={styles.titleLeft}>
                                    <Text style={styles.titleBlue}>Daftar sebagai </Text>
                                    <Text style={styles.titlePink}>PRAKTIKAN</Text>
                                </Text>
                            </View>
                        )}
                    </View>

                    {profilBelumLengkap ? (
                        <View style={styles.form}>
                            <View style={styles.fieldGroup}>
                                <Text style={styles.label}>Nama lengkap</Text>
                                <TextInput
                                    accessibilityLabel="Nama lengkap"
                                    autoCapitalize="words"
                                    editable={!mengirim}
                                    onChangeText={setNama}
                                    placeholder="Masukkan nama lengkap"
                                    placeholderTextColor={Colors.light.textSecondary}
                                    style={styles.input}
                                    value={nama}
                                />
                            </View>

                            <View style={styles.fieldGroup}>
                                <Text style={styles.label}>NIM</Text>
                                <TextInput
                                    accessibilityLabel="NIM"
                                    autoCapitalize="characters"
                                    editable={!mengirim}
                                    keyboardType="number-pad"
                                    onChangeText={setNim}
                                    placeholder="Contoh: 24060124150001"
                                    placeholderTextColor={Colors.light.textSecondary}
                                    style={styles.input}
                                    value={nim}
                                />
                            </View>

                            {!!pesanError && (
                                <Text accessibilityRole="alert" style={styles.error}>
                                    {pesanError}
                                </Text>
                            )}

                            <AppButton
                                fullWidth
                                loading={mengirim}
                                onPress={handlePulihkanProfil}
                                title="Simpan dan lanjutkan"
                            />
                        </View>
                    ) : (
                        <FormDaftar error={pesanError} loading={mengirim} onSubmit={handleDaftar} />
                    )}

                    {!profilBelumLengkap && (
                        <View style={styles.login}>
                            <Text style={styles.helper}>Sudah punya akun?</Text>
                            <Link href="/(auth)/login" style={styles.link}>
                                Masuk sekarang
                            </Link>
                        </View>
                    )}
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
        marginBottom: Spacing.one,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
    },
    logoWrapper: {
        width: 64,
        height: 64,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: Colors.light.primarySoft,
    },
    logoImage: {
        width: '100%',
        height: '100%',
    },
    titleColumn: {
        flex: 1,
        gap: 2,
    },
    titleLeft: {
        fontFamily: Fonts.sansBold,
        fontSize: 26,
        lineHeight: 34,
        letterSpacing: -0.6,
    },
    titleCenter: {
        fontFamily: Fonts.sansBold,
        fontSize: 26,
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
    helper: {
        fontFamily: Fonts.sans,
        color: Colors.light.textSecondary,
        fontSize: 14,
        lineHeight: 21,
        textAlign: 'center',
    },
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
    error: {
        fontFamily: Fonts.sans,
        color: Colors.light.danger,
        fontSize: 13,
        lineHeight: 19,
    },
    login: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: Spacing.one,
        marginTop: Spacing.one,
    },
    link: {
        fontFamily: Fonts.sansBold,
        color: Colors.light.primary,
        fontSize: 14,
        lineHeight: 21,
    },
});