import { useEffect, useRef } from 'react';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { Platform, StyleSheet, View } from 'react-native';
import type { Laboratorium } from '@/types';
import type { KoordinatPengguna } from '@/types/location';
import LaboratoryMarker from '@/components/maps/laboratory-marker';
import UserMarker from '@/components/maps/user-marker';

type Props = {
    laboratorium: Laboratorium[];
    posisiPengguna: KoordinatPengguna | null;
    onSelectLab: (lab: Laboratorium) => void;
    onClearSelection: () => void;
    centerRequest: number;
};

export default function LaboratoryMap({
    laboratorium, posisiPengguna, onSelectLab, onClearSelection, centerRequest,
}: Props) {
    const mapRef = useRef<MapView>(null);
    const positionRef = useRef(posisiPengguna);

    useEffect(() => {
        positionRef.current = posisiPengguna;
    }, [posisiPengguna]);

    useEffect(() => {
        const target = positionRef.current;
        if (centerRequest > 0 && target) {
            mapRef.current?.animateToRegion({
                latitude: target.latitude,
                longitude: target.longitude,
                latitudeDelta: 0.008,
                longitudeDelta: 0.008,
            }, 700);
        }
    }, [centerRequest]);

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                initialRegion={{
                    latitude: -7.0495,
                    longitude: 110.4405,
                    latitudeDelta: 0.012,
                    longitudeDelta: 0.012,
                }}
                showsUserLocation={false}
                showsMyLocationButton={false}
                showsCompass
                toolbarEnabled
                onPress={onClearSelection}
            >
                {laboratorium.map((lab) => (
                    <LaboratoryMarker key={lab.idLab} lab={lab} onPress={onSelectLab} />
                ))}
                {posisiPengguna && <UserMarker position={posisiPengguna} />}
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, overflow: 'hidden', borderRadius: 12 },
    map: { width: '100%', height: '100%' },
});