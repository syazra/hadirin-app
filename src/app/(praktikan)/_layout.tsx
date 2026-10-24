import { Tabs } from 'expo-router';

export default function PraktikanLayout() {
  return (
    <Tabs initialRouteName="jadwal-praktikan">
      <Tabs.Screen name="jadwal-praktikan" options={{ title: 'Jadwal' }} />
      <Tabs.Screen name="riwayat" options={{ title: 'Riwayat' }} />
    </Tabs>
  );
}
