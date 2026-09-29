import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/palette';
import { type LanguagePreference, SUPPORTED_LANGUAGES, useTranslation } from '@/lib/i18n';
import { useLanguagePreference, usePreferencesActions } from '@/stores/preferences.store';

const OPTIONS: readonly LanguagePreference[] = ['system', ...SUPPORTED_LANGUAGES];

/**
 * Manual language override for the Profile screen (EPIC-01.9). "Device language" is the default;
 * picking one applies at once, the whole app re-renders in it. Languages are named in their own
 * language (and read by VoiceOver in it), so a traveller finds theirs whatever is on screen.
 * Provisional look until the design system (EPIC-02).
 */
export function LanguagePicker() {
  const { t } = useTranslation();
  const selected = useLanguagePreference();
  const { setLanguage } = usePreferencesActions();

  return (
    <View style={styles.group}>
      <Text accessibilityRole="header" style={styles.heading}>
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
              style={({ pressed }) => [styles.option, pressed && styles.pressed]}
            >
              <Text style={[styles.label, isSelected && styles.selectedLabel]}>
                {option === 'system' ? t('profile.languageSystem') : t(`languages.${option}`)}
              </Text>
              <View style={[styles.radio, isSelected && styles.radioSelected]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  heading: { fontSize: 14, fontWeight: '600', color: Palette.secondary },
  option: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  label: { fontSize: 16, color: Palette.text },
  selectedLabel: { fontWeight: '600' },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Palette.border,
  },
  radioSelected: { borderWidth: 6, borderColor: Palette.text },
  pressed: { opacity: 0.65 },
});
