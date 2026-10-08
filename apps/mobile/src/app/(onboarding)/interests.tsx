import { router } from 'expo-router';

import { Action, Screen } from '@/components/screen';
import { useTranslation } from '@/lib/i18n';

export default function InterestsScreen() {
  const { t } = useTranslation();
  return (
    <Screen
      testID="screen-interests"
      title={t('onboarding.interests')}
      description={t('onboarding.interestsDescription')}
    >
      <Action
        testID="interests-continue"
        label={t('onboarding.continue')}
        onPress={() => router.push('/deviations')}
      />
    </Screen>
  );
}
