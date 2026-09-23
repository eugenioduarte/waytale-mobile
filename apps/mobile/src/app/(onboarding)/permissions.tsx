import { router } from 'expo-router';

import { Action, Screen } from '@/components/screen';
import copy from '@/locales/pt.json';
import { useSessionActions } from '@/stores/session.store';

export default function PermissionsScreen() {
  const { completeOnboarding } = useSessionActions();
  return (
    <Screen
      title={copy.onboarding.permissions}
      description={copy.onboarding.permissionsDescription}
    >
      <Action label={copy.onboarding.continue} onPress={completeOnboarding} />
      <Action label={copy.onboarding.back} onPress={() => router.back()} secondary />
    </Screen>
  );
}
