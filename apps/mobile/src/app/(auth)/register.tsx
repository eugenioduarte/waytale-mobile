import { router } from 'expo-router';

import { Action, Screen } from '@/components/screen';
import copy from '@/locales/pt.json';
import { useSessionActions } from '@/stores/session.store';

export default function RegisterScreen() {
  const { signIn } = useSessionActions();
  return (
    <Screen title={copy.auth.register} description={copy.auth.registerDescription}>
      <Action label={copy.auth.register} onPress={signIn} />
      <Action label={copy.auth.backToLogin} onPress={() => router.dismissTo('/login')} secondary />
    </Screen>
  );
}
