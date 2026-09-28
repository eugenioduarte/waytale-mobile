import { router } from 'expo-router';

import { Action, Screen } from '@/components/screen';
import { canUsePreviewAuth } from '@/features/auth/preview';
import copy from '@/locales/pt.json';
import { useSessionActions } from '@/stores/session.store';

export default function RegisterScreen() {
  const { signIn } = useSessionActions();
  return (
    <Screen
      testID="screen-register"
      title={copy.auth.register}
      description={copy.auth.registerDescription}
    >
      {/* Fake sign-up — with email codes the first `authApi.requestEmailCode` creates the account; the auth UI story (EPIC-04) decides whether this screen stays. */}
      {canUsePreviewAuth ? (
        <Action testID="register-submit" label={copy.auth.register} onPress={signIn} />
      ) : null}
      <Action
        testID="register-back"
        label={copy.auth.backToLogin}
        onPress={() => router.dismissTo('/login')}
        secondary
      />
    </Screen>
  );
}
