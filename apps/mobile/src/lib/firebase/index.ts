import type { AnalyticsEventName, AnalyticsEvents } from './events';

/**
 * Web build: React Native Firebase is native-only, so every call is a no-op here. Same API as
 * `index.native.ts` — see there for what each does.
 */

export type { AnalyticsEventName, AnalyticsEvents } from './events';
export type PushPlatform = 'android' | 'ios';

export async function setDataCollectionEnabled(_enabled: boolean): Promise<void> {}

export async function setAnalyticsUser(_userId: string | null): Promise<void> {}

export async function track<E extends AnalyticsEventName>(
  _event: E,
  _params: AnalyticsEvents[E],
): Promise<void> {}

export async function trackScreen(_path: string): Promise<void> {}

export async function recordError(_error: unknown, _context?: string): Promise<void> {}

export async function crashForTesting(): Promise<void> {}

export async function requestPushPermission(): Promise<boolean> {
  return false;
}

export async function hasPushPermission(): Promise<boolean> {
  return false;
}

export async function getPushToken(): Promise<{ token: string; platform: PushPlatform } | null> {
  return null;
}

export async function onPushTokenRefresh(_listener: (token: string) => void): Promise<() => void> {
  return () => {};
}

export async function registerBackgroundMessageHandler(): Promise<void> {}
