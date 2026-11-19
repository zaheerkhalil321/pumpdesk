import React from 'react';
import { Stack } from 'expo-router';

export default function DevLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="components" />
    </Stack>
  );
}
