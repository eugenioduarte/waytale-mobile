import { router } from 'expo-router';

import { Action, Screen } from '@/components/screen';
import { useTranslation } from '@/lib/i18n';

export default function WalkScreen() {
  const { t } = useTranslation();
  return (
    <Screen
      testID="screen-walk"
      title={t('journey.walk')}
      description={t('journey.walkDescription')}
    >
      <Action
        testID="walk-finish"
        label={t('journey.finish')}
        onPress={() => router.push('/summary')}
      />
    </Screen>
  );
}
