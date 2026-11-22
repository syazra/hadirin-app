import { Marker } from 'react-native-maps';
import type { Laboratorium } from '@/types';

type Props = {
  lab: Laboratorium;
  onPress: (lab: Laboratorium) => void;
};

export default function LaboratoryMarker({ lab, onPress }: Props) {
  return (
    <Marker
      coordinate={{ latitude: lab.latitude, longitude: lab.longitude }}
      title={lab.nama}
      description={`${lab.lokasiGedung} • Radius presensi ${lab.radiusPresensi} m`}
      pinColor="#208AEF"
      onPress={() => onPress(lab)}
    />
  );
}