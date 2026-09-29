import { Tabs } from 'expo-router/js-tabs';
import { SymbolView } from 'expo-symbols';

import { useSyncBadge } from '@/components/sync-status';
import { Palette } from '@/constants/palette';
import { useTranslation } from '@/lib/i18n';

export default function TabLayout() {
  const { t } = useTranslation();
  const syncBadge = useSyncBadge();
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
          title: t('tabs.explore'),
          tabBarButtonTestID: 'tab-explore',
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
          title: t('tabs.saved'),
          tabBarButtonTestID: 'tab-saved',
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
          title: t('tabs.journeys'),
          tabBarButtonTestID: 'tab-journeys',
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
          title: t('tabs.profile'),
          tabBarButtonTestID: 'tab-profile',
          // Global sync indicator: writes waiting or refused (details on the Profile screen).
          tabBarBadge: syncBadge,
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
