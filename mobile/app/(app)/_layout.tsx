import React from 'react';
import { Tabs, useSegments } from 'expo-router';
import { List, Clock, User } from 'lucide-react-native';
import { TabBar } from '@/components/ui/TabBar';
import { useTheme } from '@/theme';

export default function AppLayout() {
  const { iconSizes } = useTheme();
  // Job screens (job, ticket, signature, details) are full screens in Figma: no tab bar.
  const hideTabBar = (useSegments() as string[]).includes('[jobId]');

  return (
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
  );
}
