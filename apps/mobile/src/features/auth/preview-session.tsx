import { createContext, useContext, useState, type ReactNode } from 'react';

type PreviewSession = {
  isPreviewActive: boolean;
  enterPreview: () => void;
  exitPreview: () => void;
};

const PreviewContext = createContext<PreviewSession | null>(null);

// Navigation preview only: this is not an authenticated account or a persisted session.
export function PreviewSessionProvider({ children }: { children: ReactNode }) {
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  return (
    <PreviewContext
      value={{
        isPreviewActive,
        enterPreview: () => setIsPreviewActive(true),
        exitPreview: () => setIsPreviewActive(false),
      }}
    >
      {children}
    </PreviewContext>
  );
}

export function usePreviewSession(): PreviewSession {
  const session = useContext(PreviewContext);
  if (!session) throw new Error('PreviewSessionProvider is required.');
  return session;
}
