import React from 'react';
import { Redirect, Tabs, useSegments } from 'expo-router';
import { List, Clock, User } from 'lucide-react-native';
import { TabBar } from '@/components/ui/TabBar';
import { OutboxRejectionAlerts } from '@/components/job/OutboxRejectionAlerts';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/theme';

export default function AppLayout() {
  const { iconSizes } = useTheme();
  // Job screens (job, ticket, signature, details) are full screens in Figma: no tab bar.
  const hideTabBar = (useSegments() as string[]).includes('[jobId]');
  const { isAuthenticated, isLoading } = useAuth();

  // Signed out (by the operator, or the login expired): leave the app screens.
  if (!isLoading && !isAuthenticated) return <Redirect href="/(auth)/sign-in" />;

  return (
    <>
    <OutboxRejectionAlerts />
    <Tabs
      tabBar={hideTabBar ? () => null : (props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name="(jobs)"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color }) => (
            <List size={iconSizes.md} color={color} strokeWidth={iconSizes.strokeWidth} />
          ),
        }}
      />
      <Tabs.Screen
        name="time-clock"
        options={{
          title: 'Time clock',
          tabBarIcon: ({ color }) => (
            <Clock size={iconSizes.md} color={color} strokeWidth={iconSizes.strokeWidth} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <User size={iconSizes.md} color={color} strokeWidth={iconSizes.strokeWidth} />
          ),
        }}
      />
    </Tabs>
    </>
  );
}
