import { router } from 'expo-router';

import { Action, Screen } from '@/components/screen';
import copy from '@/locales/pt.json';

export default function InterestsScreen() {
  return (
    <Screen
      testID="screen-interests"
      title={copy.onboarding.interests}
      description={copy.onboarding.interestsDescription}
    >
      <Action
        testID="interests-continue"
        label={copy.onboarding.continue}
        onPress={() => router.push('/deviations')}
      />
    </Screen>
  );
}
