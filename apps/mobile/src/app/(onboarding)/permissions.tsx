import { router } from 'expo-router';

import { Action, Screen } from '@/components/screen';
import { useSession } from '@/features/auth/session';
import copy from '@/locales/pt.json';

export default function PermissionsScreen() {
  const { completeOnboarding } = useSession();
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
