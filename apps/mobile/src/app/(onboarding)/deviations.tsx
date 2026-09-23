import { router } from 'expo-router';

import { Action, Screen } from '@/components/screen';
import copy from '@/locales/pt.json';

export default function DeviationsScreen() {
  return (
    <Screen title={copy.onboarding.deviations} description={copy.onboarding.deviationsDescription}>
      <Action label={copy.onboarding.continue} onPress={() => router.push('/voice')} />
      <Action label={copy.onboarding.back} onPress={() => router.back()} secondary />
    </Screen>
  );
}
