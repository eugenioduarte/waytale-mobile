import { router } from 'expo-router';

import { Action, Screen } from '@/components/screen';
import { useTranslation } from '@/lib/i18n';

export default function VoiceScreen() {
  const { t } = useTranslation();
  return (
    <Screen
      testID="screen-voice"
      title={t('onboarding.voice')}
      description={t('onboarding.voiceDescription')}
    >
      <Action
        testID="voice-continue"
        label={t('onboarding.continue')}
        onPress={() => router.push('/permissions')}
      />
      <Action
        testID="voice-back"
        label={t('onboarding.back')}
        onPress={() => router.back()}
        secondary
      />
    </Screen>
  );
}
