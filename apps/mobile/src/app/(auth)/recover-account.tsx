import { router } from 'expo-router';

import { Action, Notice, Screen } from '@/components/screen';
import { useTranslation } from '@/lib/i18n';

export default function RecoverAccountScreen() {
  const { t } = useTranslation();
  return (
    <Screen
      testID="screen-recover-account"
      title={t('auth.recovery')}
      description={t('auth.recoveryDescription')}
    >
      <Notice>{t('auth.previewNotice')}</Notice>
      <Action
        testID="recover-account-back"
        label={t('auth.backToLogin')}
        onPress={() => router.dismissTo('/login')}
      />
    </Screen>
  );
}
