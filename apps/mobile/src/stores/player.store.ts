import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

/**
 * Player store — story audio playback state. Persisted so a killed app resumes the audio
 * position (01.3 acceptance). The audio engine itself lands with the story player (journey epic).
 */

type PlayerState = {
  currentAudioId: string | null;
  positionMs: number;
  isPlaying: boolean;
};

type PlayerActions = {
  playAudio: (audioId: string) => void;
  pause: () => void;
  resume: () => void;
  seekTo: (positionMs: number) => void;
  stop: () => void;
};

type PlayerStore = PlayerState & PlayerActions;

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set) => ({
      currentAudioId: null,
      positionMs: 0,
      isPlaying: false,
      playAudio: (currentAudioId) => set({ currentAudioId, positionMs: 0, isPlaying: true }),
      pause: () => set({ isPlaying: false }),
      resume: () => set({ isPlaying: true }),
      seekTo: (positionMs) => set({ positionMs }),
      stop: () => set({ currentAudioId: null, positionMs: 0, isPlaying: false }),
    }),
    {
      name: 'waytale-player',
      storage: createJSONStorage(() => AsyncStorage),
      // A cold start never auto-plays: restore what and where, and let the traveller press play.
      partialize: (state) => ({
        currentAudioId: state.currentAudioId,
        positionMs: state.positionMs,
      }),
    },
  ),
);

export function useCurrentAudioId() {
  return usePlayerStore((state) => state.currentAudioId);
}

export function usePlayerPositionMs() {
  return usePlayerStore((state) => state.positionMs);
}

export function useIsPlaying() {
  return usePlayerStore((state) => state.isPlaying);
}

export function usePlayerActions() {
  return usePlayerStore(
    useShallow((state) => ({
      playAudio: state.playAudio,
      pause: state.pause,
      resume: state.resume,
      seekTo: state.seekTo,
      stop: state.stop,
    })),
  );
}
