import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Palette } from '@/constants/palette';
import copy from '@/locales/pt.json';

export function Screen({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.brand}>{copy.brand}</Text>
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Action({
  label,
  onPress,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondaryButton,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{label}</Text>
    </Pressable>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return <Text style={styles.notice}>{children}</Text>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Palette.background },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    padding: 28,
    paddingBottom: 48,
    gap: 16,
  },
  brand: { color: Palette.text, fontSize: 20, fontWeight: '700', marginTop: 16 },
  heading: { gap: 16, paddingTop: 64, paddingBottom: 24 },
  title: { fontSize: 36, fontWeight: '700', color: Palette.text },
  description: { fontSize: 18, lineHeight: 28, color: Palette.secondary },
  notice: { fontSize: 14, lineHeight: 22, color: Palette.secondary, marginBottom: 16 },
  button: {
    minHeight: 52,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.text,
  },
  buttonText: { fontSize: 16, fontWeight: '600', color: Palette.surface, textAlign: 'center' },
  secondaryButton: {
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  secondaryText: { color: Palette.text },
  pressed: { opacity: 0.65 },
});
