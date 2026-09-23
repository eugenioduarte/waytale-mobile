import { router } from 'expo-router';

import { Action, Notice, Screen } from '@/components/screen';
import { canUsePreviewAuth } from '@/features/auth/preview';
import copy from '@/locales/pt.json';
import { useSessionActions } from '@/stores/session.store';

export default function LoginScreen() {
  const { enterPreview } = useSessionActions();
  return (
    <Screen title={copy.auth.login} description={copy.auth.loginDescription}>
      <Notice>{copy.auth.previewNotice}</Notice>
      <Action label={copy.auth.continue} onPress={() => router.push('/verify')} />
      <Action label={copy.auth.register} onPress={() => router.push('/register')} secondary />
      <Action
        label={copy.auth.recovery}
        onPress={() => router.push('/recover-account')}
        secondary
      />
      {canUsePreviewAuth ? (
        <Action label={copy.auth.preview} onPress={enterPreview} secondary />
      ) : null}
    </Screen>
  );
}
