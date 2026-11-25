import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  type MapPressEvent,
} from 'react-native-maps';

import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';

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
  visible,
  initialCoordinate,
  onClose,
  onConfirm,
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
        <Text style={styles.subtitle}>
          Ketuk peta untuk menentukan titik koordinat.
        </Text>
        <MapView
          key={sessionKey}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          onPress={pilihTitik}
        >
          {selected && (
            <Marker
              coordinate={selected}
              pinColor={Colors.light.primary}
              title="Lokasi Laboratorium"
            />
          )}
        </MapView>
        <View style={styles.footer}>
          <Text style={styles.coordinate}>
            {selected
              ? `${selected.latitude.toFixed(7)}, ${selected.longitude.toFixed(7)}`
              : 'Belum ada titik dipilih'}
          </Text>
          <View style={styles.actions}>
            <Pressable style={styles.cancel} onPress={onClose}>
              <Text style={styles.cancelText}>Batal</Text>
            </Pressable>
            <Pressable
              style={[styles.confirm, !selected && styles.disabled]}
              disabled={!selected}
              onPress={() => selected && onConfirm(selected)}
            >
              <Text style={styles.confirmText}>Gunakan Titik Ini</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    paddingTop: 48,
  },
  title: {
    fontFamily: Fonts.sansBold,
    fontSize: 19,
    color: Colors.light.text,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.light.textSecondary,
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 12,
  },
  map: { flex: 1 },
  footer: {
    padding: 18,
    gap: 12,
    backgroundColor: Colors.light.card,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  coordinate: {
    fontFamily: Fonts.mono,
    color: Colors.light.textSecondary,
    fontSize: 12.5,
  },
  actions: { flexDirection: 'row', gap: 10 },
  cancel: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radii.md,
    backgroundColor: Colors.light.backgroundElement,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: Fonts.sansSemiBold,
    color: Colors.light.text,
    fontSize: 14,
  },
  confirm: {
    flex: 2,
    minHeight: 48,
    borderRadius: Radii.md,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.primaryGlow,
  },
  confirmText: {
    fontFamily: Fonts.sansSemiBold,
    color: '#FFFFFF',
    fontSize: 14,
  },
  disabled: { opacity: 0.45 },
});
