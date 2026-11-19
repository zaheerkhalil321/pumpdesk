import React from 'react';
import { Stack } from 'expo-router';

export default function JobsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[jobId]/index" />
      <Stack.Screen name="[jobId]/details" />
      <Stack.Screen name="[jobId]/ticket" />
      <Stack.Screen name="[jobId]/signature" />
    </Stack>
  );
}
