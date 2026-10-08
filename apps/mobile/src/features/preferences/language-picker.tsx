import { Pressable, Text, View } from 'react-native';

import { type LanguagePreference, SUPPORTED_LANGUAGES, useTranslation } from '@/lib/i18n';
import { useLanguagePreference, usePreferencesActions } from '@/stores/preferences.store';

const OPTIONS: readonly LanguagePreference[] = ['system', ...SUPPORTED_LANGUAGES];

/**
 * Manual language override for the Profile screen (EPIC-01.9). "Device language" is the default;
 * picking one applies at once, the whole app re-renders in it. Languages are named in their own
 * language (and read by VoiceOver in it), so a traveller finds theirs whatever is on screen.
 * Provisional look until the design system's `RadioRow` (EPIC-02.5).
 */
export function LanguagePicker() {
  const { t } = useTranslation();
  const selected = useLanguagePreference();
  const { setLanguage } = usePreferencesActions();

  return (
    <View className="gap-2">
      <Text accessibilityRole="header" className="text-label text-ink">
        {t('profile.language')}
      </Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={t('profile.language')}>
        {OPTIONS.map((option) => {
          const isSelected = option === selected;
          return (
            <Pressable
              key={option}
              testID={`profile-language-${option}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLanguage={option === 'system' ? undefined : option}
              onPress={() => setLanguage(option)}
              className="flex-row items-center justify-between border-b border-border py-3 active:opacity-60"
            >
              <Text className={`text-body text-ink ${isSelected ? 'font-semibold' : ''}`}>
                {option === 'system' ? t('profile.languageSystem') : t(`languages.${option}`)}
              </Text>
              <View
                className={`h-5 w-5 rounded-full ${isSelected ? 'border-4 border-ink' : 'border-2 border-border'}`}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
