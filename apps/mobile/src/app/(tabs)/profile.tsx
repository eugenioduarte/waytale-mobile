import { Action, Screen } from '@/components/screen';
import { SyncStatusLine } from '@/components/sync-status';
import { useSignOut } from '@/features/auth/use-sign-out';
import { LanguagePicker } from '@/features/preferences/language-picker';
import { useTranslation } from '@/lib/i18n';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const signOut = useSignOut();
  return (
    <Screen testID="screen-profile" title={t('tabs.profile')} description={t('screens.profile')}>
      <SyncStatusLine />
      <LanguagePicker />
      <Action
        testID="profile-sign-out"
        label={t('auth.signOut')}
        onPress={() => void signOut()}
        secondary
      />
    </Screen>
  );
}
