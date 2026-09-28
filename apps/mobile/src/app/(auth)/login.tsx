import { router } from 'expo-router';

import { Action, Notice, Screen } from '@/components/screen';
import { canUsePreviewAuth } from '@/features/auth/preview';
import copy from '@/locales/pt.json';
import { useSessionActions } from '@/stores/session.store';

export default function LoginScreen() {
  const { enterPreview } = useSessionActions();
  return (
    <Screen testID="screen-login" title={copy.auth.login} description={copy.auth.loginDescription}>
      <Notice>{copy.auth.previewNotice}</Notice>
      <Action
        testID="login-continue"
        label={copy.auth.continue}
        onPress={() => router.push('/verify')}
      />
      <Action
        testID="login-register"
        label={copy.auth.register}
        onPress={() => router.push('/register')}
        secondary
      />
      <Action
        testID="login-recover"
        label={copy.auth.recovery}
        onPress={() => router.push('/recover-account')}
        secondary
      />
      {canUsePreviewAuth ? (
        <Action testID="login-preview" label={copy.auth.preview} onPress={enterPreview} secondary />
      ) : null}
    </Screen>
  );
}
