import { router } from 'expo-router';

import { Action, Screen } from '@/components/screen';
import { canUsePreviewAuth } from '@/features/auth/preview';
import { useTranslation } from '@/lib/i18n';
import { useSessionActions } from '@/stores/session.store';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { signIn } = useSessionActions();
  return (
    <Screen
      testID="screen-register"
      title={t('auth.register')}
      description={t('auth.registerDescription')}
    >
      {/* Fake sign-up — with email codes the first `authApi.requestEmailCode` creates the account; the auth UI story (EPIC-04) decides whether this screen stays. */}
      {canUsePreviewAuth ? (
        <Action testID="register-submit" label={t('auth.register')} onPress={signIn} />
      ) : null}
      <Action
        testID="register-back"
        label={t('auth.backToLogin')}
        onPress={() => router.dismissTo('/login')}
        secondary
      />
    </Screen>
  );
}
