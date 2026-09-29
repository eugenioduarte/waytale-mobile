import { router } from 'expo-router';

import { Action, Screen } from '@/components/screen';
import { useTranslation } from '@/lib/i18n';

export default function SummaryScreen() {
  const { t } = useTranslation();
  return (
    <Screen
      testID="screen-summary"
      title={t('journey.summary')}
      description={t('journey.summaryDescription')}
    >
      <Action
        testID="summary-done"
        label={t('journey.done')}
        onPress={() => router.dismissTo('/')}
      />
    </Screen>
  );
}
