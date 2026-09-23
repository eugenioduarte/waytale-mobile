import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

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
  language: 'pt' | 'en';
};

type PreferencesActions = {
  setInterests: (interests: string[]) => void;
  setDeviationTolerance: (tolerance: number) => void;
  setVoice: (voice: VoicePreference | null) => void;
  setLanguage: (language: 'pt' | 'en') => void;
};

type PreferencesStore = PreferencesState & PreferencesActions;

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      interests: [],
      deviationTolerance: 0.5,
      voice: null,
      language: 'pt',
      setInterests: (interests) => set({ interests }),
      setDeviationTolerance: (deviationTolerance) => set({ deviationTolerance }),
      setVoice: (voice) => set({ voice }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'waytale-preferences',
      storage: createJSONStorage(() => AsyncStorage),
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

export function useLanguage() {
  return usePreferencesStore((state) => state.language);
}

export function usePreferencesActions() {
  return usePreferencesStore(
    useShallow((state) => ({
      setInterests: state.setInterests,
      setDeviationTolerance: state.setDeviationTolerance,
      setVoice: state.setVoice,
      setLanguage: state.setLanguage,
    })),
  );
}
