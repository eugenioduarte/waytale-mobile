import { Action, Screen } from '@/components/screen';
import { useSignOut } from '@/features/auth/use-sign-out';
import copy from '@/locales/pt.json';

export default function ProfileScreen() {
  const signOut = useSignOut();
  return (
    <Screen title={copy.tabs.profile} description={copy.screens.profile}>
      <Action label={copy.auth.signOut} onPress={() => void signOut()} secondary />
    </Screen>
  );
}
