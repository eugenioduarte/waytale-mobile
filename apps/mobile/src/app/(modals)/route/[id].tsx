import { useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/screen';
import copy from '@/locales/pt.json';

// Deep-link target: `waytale://route/:id`.
export default function RouteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Screen
      title={copy.route.detailTitle}
      description={`${copy.route.detailDescription} · ${id}`}
    />
  );
}
