import { router } from 'expo-router';

import { Action, Notice, Screen } from '@/components/screen';
import copy from '@/locales/pt.json';

export default function RegisterScreen() {
  return (
    <Screen title={copy.auth.register} description={copy.auth.registerDescription}>
      <Notice>{copy.auth.previewNotice}</Notice>
      <Action label={copy.auth.backToLogin} onPress={() => router.dismissTo('/login')} />
    </Screen>
  );
}
