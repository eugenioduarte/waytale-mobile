import { router } from 'expo-router';

import { Action, Screen } from '@/components/screen';
import { canUsePreviewAuth } from '@/features/auth/preview';
import copy from '@/locales/pt.json';
import { useSessionActions } from '@/stores/session.store';

export default function RegisterScreen() {
  const { signIn } = useSessionActions();
  return (
    <Screen title={copy.auth.register} description={copy.auth.registerDescription}>
      {/* Fake sign-up — real phone + password (authApi.signUpWithPassword) lands with the auth UI story. */}
      {canUsePreviewAuth ? <Action label={copy.auth.register} onPress={signIn} /> : null}
      <Action label={copy.auth.backToLogin} onPress={() => router.dismissTo('/login')} secondary />
    </Screen>
  );
}
