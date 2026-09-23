import { router } from 'expo-router';

import { Action, Notice, Screen } from '@/components/screen';
import { useSession } from '@/features/auth/session';
import copy from '@/locales/pt.json';

export default function LoginScreen() {
  const { enterPreview } = useSession();
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
      <Action label={copy.auth.preview} onPress={enterPreview} secondary />
    </Screen>
  );
}
