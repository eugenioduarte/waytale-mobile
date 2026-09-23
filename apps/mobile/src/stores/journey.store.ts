import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

/**
 * Journey store — the active walk. Persisted so a killed app resumes the same stop
 * (01.3 acceptance). The durable journey history (append-only) lives in SQLite (01.4).
 */

type ActiveJourney = {
  journeyId: string;
  routeId: string;
  currentStopIndex: number;
  startedAt: string; // ISO-8601
};

type JourneyState = {
  activeJourney: ActiveJourney | null;
};

type JourneyActions = {
  startJourney: (journey: ActiveJourney) => void;
  advanceToStop: (stopIndex: number) => void;
  finishJourney: () => void;
};

type JourneyStore = JourneyState & JourneyActions;

export const useJourneyStore = create<JourneyStore>()(
  persist(
    (set) => ({
      activeJourney: null,
      startJourney: (activeJourney) => set({ activeJourney }),
      advanceToStop: (currentStopIndex) =>
        set((state) =>
          state.activeJourney
            ? { activeJourney: { ...state.activeJourney, currentStopIndex } }
            : {},
        ),
      finishJourney: () => set({ activeJourney: null }),
    }),
    {
      name: 'waytale-journey',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function useActiveJourney() {
  return useJourneyStore((state) => state.activeJourney);
}

export function useJourneyActions() {
  return useJourneyStore(
    useShallow((state) => ({
      startJourney: state.startJourney,
      advanceToStop: state.advanceToStop,
      finishJourney: state.finishJourney,
    })),
  );
}
