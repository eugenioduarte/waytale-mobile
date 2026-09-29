import { router } from 'expo-router';

import { Action, Screen } from '@/components/screen';
import { useTranslation } from '@/lib/i18n';

export default function DeviationsScreen() {
  const { t } = useTranslation();
  return (
    <Screen
      testID="screen-deviations"
      title={t('onboarding.deviations')}
      description={t('onboarding.deviationsDescription')}
    >
      <Action
        testID="deviations-continue"
        label={t('onboarding.continue')}
        onPress={() => router.push('/voice')}
      />
      <Action
        testID="deviations-back"
        label={t('onboarding.back')}
        onPress={() => router.back()}
        secondary
      />
    </Screen>
  );
}
