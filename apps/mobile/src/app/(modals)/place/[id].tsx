import { useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/screen';
import { useTranslation } from '@/lib/i18n';

export default function PlaceDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Screen
      testID="screen-place"
      title={t('place.detailTitle')}
      description={`${t('place.detailDescription')} · ${id}`}
    />
  );
}
