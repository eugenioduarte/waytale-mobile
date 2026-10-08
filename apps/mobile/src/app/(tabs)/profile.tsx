import { Action, Screen } from '@/components/screen';
import { SyncStatusLine } from '@/components/sync-status';
import { useSignOut } from '@/features/auth/use-sign-out';
import { DataCollectionToggle } from '@/features/preferences/data-collection-toggle';
import { LanguagePicker } from '@/features/preferences/language-picker';
import { crashForTesting } from '@/lib/firebase';
import { useTranslation } from '@/lib/i18n';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const signOut = useSignOut();
  return (
    <Screen testID="screen-profile" title={t('tabs.profile')} description={t('screens.profile')}>
      <SyncStatusLine />
      <LanguagePicker />
      <DataCollectionToggle />
      <Action
        testID="profile-sign-out"
        label={t('auth.signOut')}
        onPress={() => void signOut()}
        secondary
      />
      {/* Dev builds only: checks that Crashlytics receives a native crash (01.12). */}
      {__DEV__ && (
        <Action
          testID="profile-test-crash"
          label={t('profile.testCrash')}
          onPress={() => void crashForTesting()}
          secondary
        />
      )}
    </Screen>
  );
}
