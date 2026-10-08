import { Switch, Text, View } from 'react-native';

import { color } from '@/constants/tokens';
import { useTranslation } from '@/lib/i18n';
import { useDataCollectionConsent, usePreferencesActions } from '@/stores/preferences.store';

/**
 * Consent to usage analytics and crash reports (GDPR opt-in, EPIC-01.12): off until turned on
 * here; `useFirebase` applies it. Provisional look until the design system's `Switch`/`SettingsRow`
 * (EPIC-02).
 */
export function DataCollectionToggle() {
  const { t } = useTranslation();
  const enabled = useDataCollectionConsent();
  const { setDataCollection } = usePreferencesActions();

  return (
    <View className="flex-row items-center gap-4 border-b border-border py-3">
      <View className="flex-1 gap-1">
        <Text className="text-body text-ink">{t('profile.dataCollection')}</Text>
        <Text className="text-caption text-ink">{t('profile.dataCollectionDescription')}</Text>
      </View>
      <Switch
        testID="profile-data-collection"
        accessibilityLabel={t('profile.dataCollection')}
        value={enabled}
        onValueChange={setDataCollection}
        trackColor={{ false: color.border, true: color.ink }}
        thumbColor={color.surface}
      />
    </View>
  );
}
