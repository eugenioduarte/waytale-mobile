import { router } from 'expo-router';

import { Action, Screen } from '@/components/screen';
import copy from '@/locales/pt.json';

export default function VoiceScreen() {
  return (
    <Screen title={copy.onboarding.voice} description={copy.onboarding.voiceDescription}>
      <Action label={copy.onboarding.continue} onPress={() => router.push('/permissions')} />
      <Action label={copy.onboarding.back} onPress={() => router.back()} secondary />
    </Screen>
  );
}
