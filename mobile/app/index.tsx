import React from 'react';
import { Redirect } from 'expo-router';

export default function Index() {
  // Always start at the Auth flow for repeated testing (per user request)
  return <Redirect href="/(auth)/sign-in" />;
}
