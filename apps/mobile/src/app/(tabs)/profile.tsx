import { Action, Screen } from '@/components/screen';
import { useSession } from '@/features/auth/session';
import copy from '@/locales/pt.json';

export default function ProfileScreen() {
  const { signOut } = useSession();
  return (
    <Screen title={copy.tabs.profile} description={copy.screens.profile}>
      <Action label={copy.auth.signOut} onPress={signOut} secondary />
    </Screen>
  );
}
