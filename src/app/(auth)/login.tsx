import { Link, Redirect } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormLogin } from '@/components/auth/form-login';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { masuk } from '@/services/auth-service';

export default function LoginScreen() {
    const { profilBelumLengkap, error: errorAuth } = useAuth();
    const [pesan, setPesan] = useState<string | null>(null);
    const [mengirim, setMengirim] = useState(false);

    if (profilBelumLengkap) return <Redirect href="/(auth)/daftar" />;

    async function handleMasuk(email: string, password: string) {
        setMengirim(true);
        setPesan(null);
        try {
            const hasil = await masuk(email, password);
            if (!hasil.ok) setPesan(hasil.pesan);
        } catch (error) {
            setPesan(error instanceof Error ? error.message : 'Terjadi kesalahan saat masuk.');
        } finally {
            setMengirim(false);
        }
    }

    return (
        <SafeAreaView style={styles.screen}>
            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                    <View style={styles.heading}>
                        <Text accessibilityRole="header" style={styles.brand}>Hadir.in</Text>
                        <Text style={styles.title}>Masuk ke akun</Text>
                        <Text style={styles.helper}>Masuk menggunakan akun praktikan atau asisten.</Text>
                    </View>

                    <FormLogin error={pesan ?? errorAuth} loading={mengirim} onSubmit={handleMasuk} />
                    <View style={styles.register}>
                        <Text style={styles.helper}>Belum punya akun?</Text>
                        <Link href="/(auth)/daftar" style={styles.link}>Daftar sekarang</Link>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    screen: { flex: 1, backgroundColor: Colors.light.background },
    content: { flexGrow: 1, width: '100%', maxWidth: 520, alignSelf: 'center', justifyContent: 'center', padding: Spacing.four, gap: Spacing.three },
    heading: { gap: Spacing.two, marginBottom: Spacing.two },
    brand: { color: Colors.light.primary, fontSize: 28, fontWeight: '800' },
    title: { color: Colors.light.text, fontSize: 23, fontWeight: '700' },
    helper: { color: Colors.light.textSecondary, fontSize: 14, lineHeight: 21 },
    register: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: Spacing.one, marginTop: Spacing.two },
    link: { color: Colors.light.primary, fontSize: 14, fontWeight: '700' },
});
