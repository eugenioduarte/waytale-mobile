import { router } from 'expo-router';

import { Action, Notice, Screen } from '@/components/screen';
import copy from '@/locales/pt.json';

export default function RecoverAccountScreen() {
  return (
    <Screen
      testID="screen-recover-account"
      title={copy.auth.recovery}
      description={copy.auth.recoveryDescription}
    >
      <Notice>{copy.auth.previewNotice}</Notice>
      <Action
        testID="recover-account-back"
        label={copy.auth.backToLogin}
        onPress={() => router.dismissTo('/login')}
      />
    </Screen>
  );
}
