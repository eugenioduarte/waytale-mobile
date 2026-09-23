import { createContext, useContext, useState, type ReactNode } from 'react';

/**
 * Provisional session state for the navigation contract (01.2).
 *
 * This models the *shape* the app will need once 01.3 (Zustand `sessionStore`) and 01.5
 * (Supabase auth) land, so the root guard and the route groups stay stable and don't have to
 * be remapped. There is no persistence or real authentication here yet: every cold start is
 * anonymous and the actions only flip local state.
 */
type Session = {
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  /** Auth success (OTP verified, account created, social) — lands on `(onboarding)`. */
  signIn: () => void;
  /** Onboarding finished — lands on `(tabs)`. */
  completeOnboarding: () => void;
  /** Back to anonymous — lands on `(auth)`. */
  signOut: () => void;
  /** Demo shortcut: authenticated + onboarded in one step (navigation preview only). */
  enterPreview: () => void;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  return (
    <SessionContext.Provider
      value={{
        isAuthenticated,
        hasCompletedOnboarding,
        signIn: () => setIsAuthenticated(true),
        completeOnboarding: () => setHasCompletedOnboarding(true),
        signOut: () => {
          setIsAuthenticated(false);
          setHasCompletedOnboarding(false);
        },
        enterPreview: () => {
          setIsAuthenticated(true);
          setHasCompletedOnboarding(true);
        },
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error('SessionProvider is required.');
  return session;
}
