import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

/**
 * Session store — global auth/session state, consumed by the 01.2 route guard and fed by the
 * Supabase auth session (`features/auth/use-supabase-auth-sync.ts`, 01.5).
 *
 * Security contract: tokens never live here. `partialize` is an explicit whitelist, so any future
 * token field is left out of persistence by default. The Supabase session itself is kept
 * encrypted by `lib/supabase/secure-session-storage.ts`.
 */
type SessionUser = {
  id: string;
};

type SessionState = {
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  user: SessionUser | null;
};

type SessionActions = {
  /** Auth success (OTP verified, account created, social) — lands on `(onboarding)`. */
  signIn: () => void;
  /**
   * A Supabase session exists for `user`. Onboarding progress survives token refreshes and
   * re-logins of the same user, but a different user starts onboarding again.
   */
  setAuthenticatedUser: (user: SessionUser) => void;
  /** Onboarding finished — lands on `(tabs)`. */
  completeOnboarding: () => void;
  /** Back to anonymous — lands on `(auth)`. */
  signOut: () => void;
  /** Demo shortcut: authenticated + onboarded in one step (navigation preview only). */
  enterPreview: () => void;
};

type SessionStore = SessionState & SessionActions;

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      user: null,
      signIn: () => set({ isAuthenticated: true, hasCompletedOnboarding: false }),
      setAuthenticatedUser: (user) =>
        set((state) => ({
          isAuthenticated: true,
          user,
          hasCompletedOnboarding: state.user?.id === user.id && state.hasCompletedOnboarding,
        })),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      signOut: () => set({ isAuthenticated: false, hasCompletedOnboarding: false, user: null }),
      enterPreview: () => set({ isAuthenticated: true, hasCompletedOnboarding: true }),
    }),
    {
      name: 'waytale-session',
      storage: createJSONStorage(() => AsyncStorage),
      // Whitelist only: tokens must never be persisted here.
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        user: state.user,
      }),
    },
  ),
);

// Memoized selectors — never consume the whole store from a component.
export function useIsAuthenticated() {
  return useSessionStore((state) => state.isAuthenticated);
}

export function useHasCompletedOnboarding() {
  return useSessionStore((state) => state.hasCompletedOnboarding);
}

export function useSessionUser() {
  return useSessionStore((state) => state.user);
}

export function useSessionActions() {
  return useSessionStore(
    useShallow((state) => ({
      signIn: state.signIn,
      setAuthenticatedUser: state.setAuthenticatedUser,
      completeOnboarding: state.completeOnboarding,
      signOut: state.signOut,
      enterPreview: state.enterPreview,
    })),
  );
}
