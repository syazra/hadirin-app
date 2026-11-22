import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type MapPressEvent } from 'react-native-maps';

type Koordinat = { latitude: number; longitude: number };

type Props = {
    visible: boolean;
    initialCoordinate: Koordinat | null;
    onClose: () => void;
    onConfirm: (coordinate: Koordinat) => void;
};

const DEFAULT_REGION = {
    latitude: -7.0495,
    longitude: 110.4405,
    latitudeDelta: 0.012,
    longitudeDelta: 0.012,
};

export default function LaboratoryPickerMap({
    visible, initialCoordinate, onClose, onConfirm,
}: Props) {
    const [selected, setSelected] = useState<Koordinat | null>(null);
    const [sessionKey, setSessionKey] = useState(0);
    const pilihTitik = (event: MapPressEvent) => {
        setSelected(event.nativeEvent.coordinate);
    };

    const region = initialCoordinate
        ? { ...initialCoordinate, latitudeDelta: 0.006, longitudeDelta: 0.006 }
        : DEFAULT_REGION;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onShow={() => {
            setSelected(initialCoordinate);
            setSessionKey((value) => value + 1);
            }}
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <Text style={styles.title}>Pilih Lokasi Laboratorium</Text>
                <Text style={styles.subtitle}>Ketuk peta untuk menentukan titik laboratorium.</Text>
                <MapView key={sessionKey} style={styles.map} initialRegion={region} onPress={pilihTitik}>
                    {selected && <Marker coordinate={selected} pinColor="#208AEF" title="Lokasi Laboratorium" />}
                </MapView>
                <View style={styles.footer}>
                    <Text style={styles.coordinate}>
                        {selected ? `${selected.latitude.toFixed(7)}, ${selected.longitude.toFixed(7)}` : 'Belum ada titik dipilih'}
                    </Text>
                    <View style={styles.actions}>
                        <Pressable style={styles.cancel} onPress={onClose}>
                            <Text style={styles.cancelText}>Batal</Text>
                        </Pressable>
                        <Pressable style={[styles.confirm, !selected && styles.disabled]} disabled={!selected} onPress={() => selected && onConfirm(selected)}>
                            <Text style={styles.confirmText}>Gunakan Titik Ini</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF', paddingTop: 48 },
    title: { fontSize: 20, fontWeight: '700', color: '#172033', paddingHorizontal: 18 },
    subtitle: { fontSize: 13, color: '#667085', paddingHorizontal: 18, marginTop: 6, marginBottom: 12 },
    map: { flex: 1 },
    footer: { padding: 16, gap: 12 },
    coordinate: { color: '#475467', fontSize: 13 },
    actions: { flexDirection: 'row', gap: 10 },
    cancel: { flex: 1, padding: 14, borderRadius: 9, backgroundColor: '#F2F4F7', alignItems: 'center' },
    cancelText: { color: '#344054', fontWeight: '600' },
    confirm: { flex: 2, padding: 14, borderRadius: 9, backgroundColor: '#2563EB', alignItems: 'center' },
    confirmText: { color: '#FFFFFF', fontWeight: '700' },
    disabled: { opacity: 0.4 },
});