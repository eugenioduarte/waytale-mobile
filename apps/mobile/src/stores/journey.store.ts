import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import { minutesSince } from '@/lib/date';
import { track } from '@/lib/firebase';

/**
 * Journey store — the active walk. Persisted so a killed app resumes the same stop
 * (01.3 acceptance). The durable journey history (append-only) lives in SQLite (01.4).
 *
 * Starting and finishing are the product's `route_started` / `journey_completed` events (01.12):
 * tracked here, the one place every start and finish goes through.
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
    (set, get) => ({
      activeJourney: null,
      startJourney: (activeJourney) => {
        set({ activeJourney });
        void track('route_started', { route_id: activeJourney.routeId });
      },
      advanceToStop: (currentStopIndex) =>
        set((state) =>
          state.activeJourney
            ? { activeJourney: { ...state.activeJourney, currentStopIndex } }
            : {},
        ),
      finishJourney: () => {
        const finished = get().activeJourney;
        set({ activeJourney: null });
        if (finished) {
          void track('journey_completed', {
            journey_id: finished.journeyId,
            route_id: finished.routeId,
            duration_minutes: minutesSince(finished.startedAt),
          });
        }
      },
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
