import { useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/screen';
import copy from '@/locales/pt.json';

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Screen
      title={copy.place.detailTitle}
      description={`${copy.place.detailDescription} · ${id}`}
    />
  );
}
