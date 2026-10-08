import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';

import { Action, Notice, Screen } from './screen';

const meta = {
  title: 'App/Screen',
  component: Screen,
  // Screen draws its own background and safe area.
  parameters: { layout: 'fullscreen' },
  args: {
    title: 'Login',
    description: 'Uma nova forma de descobrir a cidade, uma história de cada vez.',
  },
} satisfies Meta<typeof Screen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithActions: Story = {
  render: (args) => (
    <Screen {...args}>
      <Notice>Por enquanto, pode conhecer o app em modo de demonstração.</Notice>
      <Action testID="story-continue" label="Continuar" onPress={fn()} />
      <Action testID="story-register" label="Criar conta" onPress={fn()} secondary />
    </Screen>
  ),
};

export const TitleOnly: Story = {};
