import { Tabs } from 'expo-router';

export default function AsistenLayout() {
  return (
    <Tabs initialRouteName="jadwal-asisten">
      <Tabs.Screen name="jadwal-asisten" options={{ title: 'Jadwal' }} />
      <Tabs.Screen name="rekap" options={{ title: 'Rekap' }} />
    </Tabs>
  );
}
