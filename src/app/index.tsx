import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { LayarPersiapan } from '@/components/shared/layar-persiapan';
import { Colors } from '@/constants/theme';

// TODO(Farhan): pilihan peran dan identitas pada Tahap 1b.
export default function HomeScreen() {
  return (
    <LayarPersiapan judul="Hadir.in" pesan="Sistem Informasi Praktikum">
      <Text style={styles.heading}>Jadwal praktikum</Text>
      <Link href="/(asisten)/jadwal-asisten" style={styles.link}>Buka jadwal Asisten</Link>
      <Link href="/(praktikan)/jadwal-praktikan" style={styles.link}>Buka jadwal Praktikan</Link>
    </LayarPersiapan>
  );
}

const styles = StyleSheet.create({
  heading: { color: Colors.light.text, fontSize: 18, fontWeight: '600' },
  link: { color: Colors.light.primary, minHeight: 48, paddingVertical: 12, fontSize: 16 },
});
