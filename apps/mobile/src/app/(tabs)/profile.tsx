import { Action, Screen } from '@/components/screen';
import copy from '@/locales/pt.json';
import { useSessionActions } from '@/stores/session.store';

export default function ProfileScreen() {
  const { signOut } = useSessionActions();
  return (
    <Screen title={copy.tabs.profile} description={copy.screens.profile}>
      <Action label={copy.auth.signOut} onPress={signOut} secondary />
    </Screen>
  );
}
