import { cssInterop } from 'nativewind';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslation } from '@/lib/i18n';

// Third-party components need opting in to `className` (React Native's own work out of the box).
cssInterop(SafeAreaView, { className: 'style' });

/**
 * Provisional screen shell, styled only with NativeWind classes (01.10). EPIC-02.2 replaces it
 * with the design system's `Screen`, `Text` and buttons.
 */
export function Screen({
  title,
  description,
  testID,
  children,
}: {
  title: string;
  description: string;
  /** Lets E2E flows (Maestro) wait for this screen: `screen-<route>`. */
  testID?: string;
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <SafeAreaView testID={testID} className="flex-1 bg-surface" edges={['top', 'left', 'right']}>
      <ScrollView contentContainerClassName="grow gap-4 p-6 pb-9">
        <Text className="mt-4 text-section text-ink">{t('brand')}</Text>
        <View className="gap-4 pb-6 pt-9">
          <Text accessibilityRole="header" className="text-display text-ink">
            {title}
          </Text>
          <Text className="text-body text-ink">{description}</Text>
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Action({
  label,
  onPress,
  testID,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  /** Required on every interactive element (`<screen>-<action>`), see `waytale/require-testid`. */
  testID: string;
  secondary?: boolean;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      className={`items-center justify-center rounded-md p-4 active:opacity-60 ${
        secondary ? 'border border-border bg-surface' : 'bg-ink'
      }`}
    >
      <Text className={`text-center text-section ${secondary ? 'text-ink' : 'text-surface'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return <Text className="mb-4 text-caption text-ink">{children}</Text>;
}
