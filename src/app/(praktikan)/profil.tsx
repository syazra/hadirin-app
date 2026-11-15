import { StyleSheet, Text, View } from 'react-native';

import { ProfilCard } from '@/components/shared/profil-card';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

export default function ProfilPraktikanScreen() {
    const { pengguna } = useAuth();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Profil Praktikan</Text>
            {pengguna?.peran === 'PRAKTIKAN' ? <ProfilCard pengguna={pengguna} /> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, gap: Spacing.three, padding: Spacing.four, backgroundColor: Colors.light.background },
    title: { color: Colors.light.text, fontSize: 20, fontWeight: '700' },
});
