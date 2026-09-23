import { router } from 'expo-router';

import { Action, Screen } from '@/components/screen';
import { useSession } from '@/features/auth/session';
import copy from '@/locales/pt.json';

export default function VerifyScreen() {
  const { signIn } = useSession();
  return (
    <Screen title={copy.auth.verify} description={copy.auth.verifyDescription}>
      {/* Provisional: signIn() flips the root guard, which unmounts `(auth)` — so going back
          after verifying can never re-enter this screen. */}
      <Action label={copy.auth.verifyAction} onPress={signIn} />
      <Action label={copy.auth.backToLogin} onPress={() => router.back()} secondary />
    </Screen>
  );
}
