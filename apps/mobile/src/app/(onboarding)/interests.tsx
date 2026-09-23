import { router } from 'expo-router';

import { Action, Screen } from '@/components/screen';
import copy from '@/locales/pt.json';

export default function InterestsScreen() {
  return (
    <Screen title={copy.onboarding.interests} description={copy.onboarding.interestsDescription}>
      <Action label={copy.onboarding.continue} onPress={() => router.push('/deviations')} />
    </Screen>
  );
}
