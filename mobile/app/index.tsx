import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

/** Launch: signed-in operators go straight to their jobs; everyone else signs in. */
export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return <Redirect href={isAuthenticated ? '/(app)/(jobs)' : '/(auth)/sign-in'} />;
}
