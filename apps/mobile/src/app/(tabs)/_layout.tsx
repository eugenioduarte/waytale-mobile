import { Tabs } from 'expo-router/js-tabs';
import { SymbolView } from 'expo-symbols';

import { Palette } from '@/constants/palette';
import copy from '@/locales/pt.json';

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="index"
      backBehavior="initialRoute"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Palette.text,
        tabBarInactiveTintColor: Palette.secondary,
        tabBarStyle: { backgroundColor: Palette.surface, borderTopColor: Palette.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: copy.tabs.explore,
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'safari', android: 'explore', web: 'explore' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: copy.tabs.saved,
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'bookmark', android: 'bookmark', web: 'bookmark' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="journeys"
        options={{
          title: copy.tabs.journeys,
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'map', android: 'map', web: 'map' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: copy.tabs.profile,
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'person.crop.circle', android: 'person', web: 'person' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}
