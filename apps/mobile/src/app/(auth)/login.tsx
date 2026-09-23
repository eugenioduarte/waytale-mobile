import { router } from 'expo-router';

import { Action, Notice, Screen } from '@/components/screen';
import { usePreviewSession } from '@/features/auth/preview-session';
import copy from '@/locales/pt.json';

export default function LoginScreen() {
  const { enterPreview } = usePreviewSession();
  return (
    <Screen title={copy.auth.login} description={copy.auth.loginDescription}>
      <Notice>{copy.auth.previewNotice}</Notice>
      <Action label={copy.auth.preview} onPress={enterPreview} />
      <Action label={copy.auth.register} onPress={() => router.push('/register')} secondary />
      <Action
        label={copy.auth.recovery}
        onPress={() => router.push('/recover-account')}
        secondary
      />
    </Screen>
  );
}
