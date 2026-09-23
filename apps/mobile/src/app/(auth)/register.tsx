import { router } from 'expo-router';

import { Action, Screen } from '@/components/screen';
import { useSession } from '@/features/auth/session';
import copy from '@/locales/pt.json';

export default function RegisterScreen() {
  const { signIn } = useSession();
  return (
    <Screen title={copy.auth.register} description={copy.auth.registerDescription}>
      <Action label={copy.auth.register} onPress={signIn} />
      <Action label={copy.auth.backToLogin} onPress={() => router.dismissTo('/login')} secondary />
    </Screen>
  );
}
