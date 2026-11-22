import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { Laboratorium } from '@/types';
import { LaboratoryActivityList } from '@/components/maps/laboratory-activity-list';

type Props = {
  laboratorium: Laboratorium | null;
  onClose: () => void;
};

export default function LaboratoryInfoSheet({ laboratorium, onClose }: Props) {
  return (
    <Modal
      visible={!!laboratorium}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{laboratorium?.nama}</Text>
              <Text style={styles.subtitle}>
                {laboratorium?.kodeLab} • {laboratorium?.lokasiGedung}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          {laboratorium && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.info}>
                <Text style={styles.infoLabel}>Lokasi</Text>
                <Text style={styles.infoValue}>{laboratorium.lokasiGedung}</Text>
                <Text style={styles.infoLabel}>Radius Presensi</Text>
                <Text style={styles.infoValue}>
                  {laboratorium.radiusPresensi} meter
                </Text>
              </View>

              <Text style={styles.sectionTitle}>Aktivitas Laboratorium</Text>
              <LaboratoryActivityList labId={laboratorium.idLab} />
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    maxHeight: '75%',
    minHeight: 260,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 5,
    backgroundColor: '#D0D5DD',
    alignSelf: 'center',
    marginBottom: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerText: { flex: 1, gap: 4 },
  title: { fontSize: 18, fontWeight: '700', color: '#172033' },
  subtitle: { fontSize: 13, color: '#667085' },
  close: { fontSize: 20, color: '#667085', paddingHorizontal: 6 },
  info: {
    backgroundColor: '#F2F4F7',
    borderRadius: 12,
    padding: 14,
    gap: 5,
    marginBottom: 18,
  },
  infoLabel: { fontSize: 12, color: '#667085' },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#172033',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#172033',
    marginBottom: 12,
  },
});