import { Action, Screen } from '@/components/screen';
import { SyncStatusLine } from '@/components/sync-status';
import { useSignOut } from '@/features/auth/use-sign-out';
import copy from '@/locales/pt.json';

export default function ProfileScreen() {
  const signOut = useSignOut();
  return (
    <Screen title={copy.tabs.profile} description={copy.screens.profile}>
      <SyncStatusLine />
      <Action label={copy.auth.signOut} onPress={() => void signOut()} secondary />
    </Screen>
  );
}
