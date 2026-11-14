import { StyleSheet, Text, View } from 'react-native';

export default function KelasScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Ajukan Izin</Text>
            <Text>Stub halaman kelas. Menunggu implementasi Binar.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    title: { fontSize: 20, fontWeight: '700' },
});