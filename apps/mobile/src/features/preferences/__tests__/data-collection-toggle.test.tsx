import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';

import { DataCollectionToggle } from '@/features/preferences/data-collection-toggle';
import { usePreferencesStore } from '@/stores/preferences.store';
import { renderWithProviders } from '@tests/render';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('DataCollectionToggle', () => {
  it('is off until the traveller turns it on (GDPR opt-in)', () => {
    renderWithProviders(<DataCollectionToggle />);

    expect(screen.getByTestId('profile-data-collection').props.value).toBe(false);
  });

  it('saves the consent', () => {
    renderWithProviders(<DataCollectionToggle />);

    fireEvent(screen.getByTestId('profile-data-collection'), 'valueChange', true);

    expect(usePreferencesStore.getState().dataCollection).toBe(true);
  });

  it('can be withdrawn', () => {
    renderWithProviders(<DataCollectionToggle />, {
      stores: { preferences: { dataCollection: true } },
    });

    fireEvent(screen.getByTestId('profile-data-collection'), 'valueChange', false);

    expect(usePreferencesStore.getState().dataCollection).toBe(false);
  });
});
