import { Stack } from 'expo-router';

export default function TabLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="queue" />
      <Stack.Screen name="materials" />
      <Stack.Screen name="maintenance" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
