import { ScrollView, StyleSheet } from 'react-native';

import { ProfilCard } from '@/components/shared/profil-card';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

export default function ProfilAsistenScreen() {
    const { pengguna } = useAuth();

    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
        >
            {pengguna?.peran === 'ASISTEN' ? <ProfilCard pengguna={pengguna} /> : null}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    container: {
        flexGrow: 1,
        gap: Spacing.three,
        padding: Spacing.four,
        paddingBottom: Spacing.five,
    },
});