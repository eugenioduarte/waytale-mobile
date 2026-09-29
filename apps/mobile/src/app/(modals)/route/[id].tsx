import { useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/screen';
import { useTranslation } from '@/lib/i18n';

// Deep-link target: `waytale://route/:id`.
export default function RouteDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Screen
      testID="screen-route"
      title={t('route.detailTitle')}
      description={`${t('route.detailDescription')} · ${id}`}
    />
  );
}
