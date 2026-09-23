import { router } from 'expo-router';

import { Action, Screen } from '@/components/screen';
import { canUsePreviewAuth } from '@/features/auth/preview';
import copy from '@/locales/pt.json';
import { useSessionActions } from '@/stores/session.store';

export default function VerifyScreen() {
  const { signIn } = useSessionActions();
  return (
    <Screen title={copy.auth.verify} description={copy.auth.verifyDescription}>
      {/* Provisional: signIn() flips the root guard, which unmounts `(auth)` — so going back
          after verifying can never re-enter this screen. */}
      {/* Fake verification — real OTP entry (authApi.verifyOtp) lands with the auth UI story. */}
      {canUsePreviewAuth ? <Action label={copy.auth.verifyAction} onPress={signIn} /> : null}
      <Action label={copy.auth.backToLogin} onPress={() => router.back()} secondary />
    </Screen>
  );
}
