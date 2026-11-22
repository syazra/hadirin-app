import { Marker } from 'react-native-maps';
import type { KoordinatPengguna } from '@/types/location';

type Props = {
  position: KoordinatPengguna;
};

export default function UserMarker({ position }: Props) {
  return (
    <Marker
      coordinate={{
        latitude: position.latitude,
        longitude: position.longitude,
      }}
      title="Lokasi Saya"
      description="Posisi perangkat saat ini"
      pinColor="#16A34A"
    />
  );
}