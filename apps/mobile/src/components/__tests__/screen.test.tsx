import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';

import { Action, Notice, Screen } from '@/components/screen';
import { renderWithProviders } from '@tests/render';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('Screen', () => {
  it('announces its title as the header and shows the description', () => {
    renderWithProviders(<Screen testID="screen-test" title="Login" description="Bem-vindo" />);

    expect(screen.getByRole('header', { name: 'Login' })).toBeTruthy();
    expect(screen.getByText('Bem-vindo')).toBeTruthy();
    expect(screen.getByTestId('screen-test')).toBeTruthy();
  });

  it('renders its content', () => {
    renderWithProviders(
      <Screen title="Login" description="Bem-vindo">
        <Notice>Modo de demonstração</Notice>
      </Screen>,
    );

    expect(screen.getByText('Modo de demonstração')).toBeTruthy();
  });
});

describe('Action', () => {
  it('is a button, found by its testID, that calls onPress', () => {
    const onPress = jest.fn();
    renderWithProviders(<Action testID="login-continue" label="Continuar" onPress={onPress} />);

    fireEvent.press(screen.getByTestId('login-continue'));

    expect(screen.getByRole('button', { name: 'Continuar' })).toBeTruthy();
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
