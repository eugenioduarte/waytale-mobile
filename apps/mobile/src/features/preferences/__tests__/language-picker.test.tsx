import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';

import { LanguagePicker } from '@/features/preferences/language-picker';
import { usePreferencesStore } from '@/stores/preferences.store';
import { renderWithProviders } from '@tests/render';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// jest-expo's `expo-localization` mock is an `en-US` device; nothing here changes the language.
describe('LanguagePicker', () => {
  it('offers the device language and each supported language, named in its own language', () => {
    renderWithProviders(<LanguagePicker />);

    expect(screen.getByLabelText('Language').props.accessibilityRole).toBe('radiogroup');
    expect(
      screen.getAllByRole('radio').map((radio) => radio.props.testID as string | undefined),
    ).toEqual([
      'profile-language-system',
      'profile-language-pt',
      'profile-language-en',
      'profile-language-es',
    ]);
    expect(screen.getByRole('radio', { name: 'Português' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Español' })).toBeTruthy();
  });

  it('follows the device by default', () => {
    renderWithProviders(<LanguagePicker />);

    expect(screen.getByRole('radio', { name: 'Device language', checked: true })).toBeTruthy();
    expect(screen.getAllByRole('radio', { checked: true })).toHaveLength(1);
  });

  it('shows the saved choice', () => {
    renderWithProviders(<LanguagePicker />, { stores: { preferences: { language: 'es' } } });

    expect(screen.getByRole('radio', { name: 'Español', checked: true })).toBeTruthy();
  });

  it('saves the language picked', () => {
    renderWithProviders(<LanguagePicker />);

    fireEvent.press(screen.getByTestId('profile-language-pt'));

    expect(usePreferencesStore.getState().language).toBe('pt');
    expect(screen.getByRole('radio', { name: 'Português', checked: true })).toBeTruthy();
  });
});
