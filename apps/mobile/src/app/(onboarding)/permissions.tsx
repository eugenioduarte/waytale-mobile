import { router } from 'expo-router';

import { Action, Screen } from '@/components/screen';
import { registerThisDevice } from '@/features/push/device';
import { requestPushPermission } from '@/lib/firebase';
import { useTranslation } from '@/lib/i18n';
import { useSessionActions } from '@/stores/session.store';

export default function PermissionsScreen() {
  const { t } = useTranslation();
  const { completeOnboarding } = useSessionActions();
  // Notifications are asked here, in context, never on first launch (01.12). Refusing is fine:
  // onboarding goes on either way.
  const onContinue = async () => {
    if (await requestPushPermission()) void registerThisDevice();
    completeOnboarding();
  };
  return (
    <Screen
      testID="screen-permissions"
      title={t('onboarding.permissions')}
      description={t('onboarding.permissionsDescription')}
    >
      <Action
        testID="permissions-continue"
        label={t('onboarding.continue')}
        onPress={() => void onContinue()}
      />
      <Action
        testID="permissions-back"
        label={t('onboarding.back')}
        onPress={() => router.back()}
        secondary
      />
    </Screen>
  );
}
