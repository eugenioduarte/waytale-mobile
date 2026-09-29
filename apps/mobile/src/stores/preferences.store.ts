import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import { isLanguagePreference, type LanguagePreference } from '@/lib/i18n/languages';

/**
 * Preferences store — the traveller's interests, deviations, narrator voice and language.
 * The exact schema is refined against the design when onboarding (EPIC-02+) lands.
 */

type VoicePreference = {
  voiceId: string;
};

type PreferencesState = {
  interests: string[];
  /** Continuous preference: 0 = "direto", 1 = "sem pressa" (business rule, see project.md). */
  deviationTolerance: number;
  voice: VoicePreference | null;
  /** Manual override from Profile; `'system'` follows the device (see `src/lib/i18n`). */
  language: LanguagePreference;
  /**
   * Consent to share usage analytics and crash reports (GDPR opt-in, EPIC-01.12): false until the
   * traveller turns it on. Persisted stores missing it keep this default.
   */
  dataCollection: boolean;
};

type PreferencesActions = {
  setInterests: (interests: string[]) => void;
  setDeviationTolerance: (tolerance: number) => void;
  setVoice: (voice: VoicePreference | null) => void;
  setLanguage: (language: LanguagePreference) => void;
  setDataCollection: (enabled: boolean) => void;
};

type PreferencesStore = PreferencesState & PreferencesActions;

/**
 * v0 persisted `language: 'pt'` as a default nobody could change (there was no picker), so it
 * becomes `'system'`; anything unknown does too.
 */
export function migratePreferences(persisted: unknown, version: number): Partial<PreferencesState> {
  if (typeof persisted !== 'object' || persisted === null) return {};
  const state: Partial<PreferencesState> = persisted;
  const language =
    version === 0 || !isLanguagePreference(state.language) ? 'system' : state.language;
  return { ...state, language };
}

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      interests: [],
      deviationTolerance: 0.5,
      voice: null,
      language: 'system',
      dataCollection: false,
      setInterests: (interests) => set({ interests }),
      setDeviationTolerance: (deviationTolerance) => set({ deviationTolerance }),
      setVoice: (voice) => set({ voice }),
      setLanguage: (language) => set({ language }),
      setDataCollection: (dataCollection) => set({ dataCollection }),
    }),
    {
      name: 'waytale-preferences',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      migrate: (persisted, version) => migratePreferences(persisted, version) as PreferencesStore,
    },
  ),
);

export function useInterests() {
  return usePreferencesStore((state) => state.interests);
}

export function useDeviationTolerance() {
  return usePreferencesStore((state) => state.deviationTolerance);
}

export function useVoicePreference() {
  return usePreferencesStore((state) => state.voice);
}

export function useLanguagePreference() {
  return usePreferencesStore((state) => state.language);
}

export function useDataCollectionConsent() {
  return usePreferencesStore((state) => state.dataCollection);
}

export function usePreferencesActions() {
  return usePreferencesStore(
    useShallow((state) => ({
      setInterests: state.setInterests,
      setDeviationTolerance: state.setDeviationTolerance,
      setVoice: state.setVoice,
      setLanguage: state.setLanguage,
      setDataCollection: state.setDataCollection,
    })),
  );
}
