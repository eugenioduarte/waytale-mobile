import { router } from 'expo-router';

import { Action, Screen } from '@/components/screen';
import copy from '@/locales/pt.json';
import { useSessionActions } from '@/stores/session.store';

export default function VerifyScreen() {
  const { signIn } = useSessionActions();
  return (
    <Screen title={copy.auth.verify} description={copy.auth.verifyDescription}>
      {/* Provisional: signIn() flips the root guard, which unmounts `(auth)` — so going back
          after verifying can never re-enter this screen. */}
      <Action label={copy.auth.verifyAction} onPress={signIn} />
      <Action label={copy.auth.backToLogin} onPress={() => router.back()} secondary />
    </Screen>
  );
}
