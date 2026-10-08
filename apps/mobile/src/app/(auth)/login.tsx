import { router } from 'expo-router';

import { Action, Notice, Screen } from '@/components/screen';
import { canUsePreviewAuth } from '@/features/auth/preview';
import { useTranslation } from '@/lib/i18n';
import { useSessionActions } from '@/stores/session.store';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { enterPreview } = useSessionActions();
  return (
    <Screen testID="screen-login" title={t('auth.login')} description={t('auth.loginDescription')}>
      <Notice>{t('auth.previewNotice')}</Notice>
      <Action
        testID="login-continue"
        label={t('auth.continue')}
        onPress={() => router.push('/verify')}
      />
      <Action
        testID="login-register"
        label={t('auth.register')}
        onPress={() => router.push('/register')}
        secondary
      />
      <Action
        testID="login-recover"
        label={t('auth.recovery')}
        onPress={() => router.push('/recover-account')}
        secondary
      />
      {canUsePreviewAuth ? (
        <Action testID="login-preview" label={t('auth.preview')} onPress={enterPreview} secondary />
      ) : null}
    </Screen>
  );
}
