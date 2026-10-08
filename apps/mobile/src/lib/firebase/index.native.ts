import { PermissionsAndroid, Platform } from 'react-native';

import type { AnalyticsEventName, AnalyticsEvents } from './events';

/**
 * Firebase for the app (EPIC-01.12): Analytics, Crashlytics and Cloud Messaging through React
 * Native Firebase. Config comes from `google-services.json` / `GoogleService-Info.plist`
 * (`app.config.js`) and `firebase.json`.
 *
 * - **Consent first (GDPR):** `firebase.json` starts with Analytics and Crashlytics collection
 *   off; `setDataCollectionEnabled` turns them on once the traveller agrees (see
 *   `useFirebase`). Push needs its own OS permission.
 * - **Never breaks the app:** the native modules load lazily, and every call is a no-op when
 *   they're missing (Expo Go, Jest) or fail — analytics must not be why a walk stops.
 * - Needs a dev client / native build (`expo-dev-client`); Expo Go has no Firebase.
 */

export type { AnalyticsEventName, AnalyticsEvents } from './events';
export type PushPlatform = 'android' | 'ios';

type Modules = {
  analytics: typeof import('@react-native-firebase/analytics');
  crashlytics: typeof import('@react-native-firebase/crashlytics');
  messaging: typeof import('@react-native-firebase/messaging');
};

let loaded: Modules | null | undefined;

/**
 * The RNFB modules, or null when this build has no Firebase (their import throws without the
 * native side). Loaded once, on first use. A lazy `require` rather than `import()`: Metro bundles
 * it all the same, and Jest can run and mock it (it can't evaluate a dynamic import).
 */
function load(): Modules | null {
  if (loaded === undefined) {
    try {
      /* eslint-disable @typescript-eslint/no-require-imports */
      loaded = {
        analytics: require('@react-native-firebase/analytics') as Modules['analytics'],
        crashlytics: require('@react-native-firebase/crashlytics') as Modules['crashlytics'],
        messaging: require('@react-native-firebase/messaging') as Modules['messaging'],
      };
      /* eslint-enable @typescript-eslint/no-require-imports */
    } catch {
      loaded = null;
    }
  }
  return loaded;
}

/** Runs `task` with Firebase, swallowing failures: returns `fallback` if it can't. */
async function withFirebase<T>(fallback: T, task: (modules: Modules) => Promise<T>): Promise<T> {
  const modules = load();
  if (!modules) return fallback;
  try {
    return await task(modules);
  } catch (error) {
    if (__DEV__) console.warn('[firebase]', error);
    return fallback;
  }
}

// --- Consent ------------------------------------------------------------------------------------

/** Turns Analytics and Crashlytics collection on or off (persisted natively across launches). */
export function setDataCollectionEnabled(enabled: boolean): Promise<void> {
  return withFirebase(undefined, async ({ analytics, crashlytics }) => {
    await analytics.setAnalyticsCollectionEnabled(analytics.getAnalytics(), enabled);
    await crashlytics.setCrashlyticsCollectionEnabled(crashlytics.getCrashlytics(), enabled);
  });
}

/** Ties events and crash reports to the (pseudonymous) Supabase user id; null on sign-out. */
export function setAnalyticsUser(userId: string | null): Promise<void> {
  return withFirebase(undefined, async ({ analytics, crashlytics }) => {
    await analytics.setUserId(analytics.getAnalytics(), userId);
    await crashlytics.setUserId(crashlytics.getCrashlytics(), userId ?? '');
  });
}

// --- Analytics ----------------------------------------------------------------------------------

/** Logs one of the product events in `events.ts`. */
export function track<E extends AnalyticsEventName>(
  event: E,
  params: AnalyticsEvents[E],
): Promise<void> {
  return withFirebase(undefined, async ({ analytics }) => {
    await analytics.logEvent(analytics.getAnalytics(), event, params);
  });
}

/** Logs a screen view for an expo-router path (automatic screen reporting is off). */
export function trackScreen(path: string): Promise<void> {
  return withFirebase(undefined, async ({ analytics }) => {
    await analytics.logScreenView(analytics.getAnalytics(), {
      screen_name: path,
      screen_class: path,
    });
  });
}

// --- Crashlytics --------------------------------------------------------------------------------

/** Reports a handled error (non-fatal), e.g. a sync failure worth watching. */
export function recordError(error: unknown, context?: string): Promise<void> {
  return withFirebase(undefined, async ({ crashlytics }) => {
    const instance = crashlytics.getCrashlytics();
    if (context) crashlytics.log(instance, context);
    crashlytics.recordError(instance, error instanceof Error ? error : new Error(String(error)));
  });
}

/** Crashes the app natively — only to check that Crashlytics receives reports (dev button). */
export function crashForTesting(): Promise<void> {
  return withFirebase(undefined, async ({ crashlytics }) => {
    crashlytics.crash(crashlytics.getCrashlytics());
  });
}

// --- Push (Cloud Messaging) ---------------------------------------------------------------------

const platform: PushPlatform = Platform.OS === 'ios' ? 'ios' : 'android';

/**
 * Asks the OS to allow notifications. Android 13+ has its own runtime permission; iOS asks
 * through Firebase (APNs). Returns whether notifications may be shown.
 */
export function requestPushPermission(): Promise<boolean> {
  return withFirebase(false, async ({ messaging }) => {
    if (Platform.OS === 'android') {
      if (Platform.Version < 33) return true;
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
    const status = await messaging.requestPermission(messaging.getMessaging());
    return (
      status === messaging.AuthorizationStatus.AUTHORIZED ||
      status === messaging.AuthorizationStatus.PROVISIONAL
    );
  });
}

/** Whether notifications are allowed already — without asking. */
export function hasPushPermission(): Promise<boolean> {
  return withFirebase(false, async ({ messaging }) => {
    if (Platform.OS === 'android') {
      if (Platform.Version < 33) return true;
      return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }
    const status = await messaging.hasPermission(messaging.getMessaging());
    return (
      status === messaging.AuthorizationStatus.AUTHORIZED ||
      status === messaging.AuthorizationStatus.PROVISIONAL
    );
  });
}

/** This device's FCM token, or null when there's no Firebase / no network yet. */
export function getPushToken(): Promise<{ token: string; platform: PushPlatform } | null> {
  return withFirebase(null, async ({ messaging }) => {
    const token = await messaging.getToken(messaging.getMessaging());
    return token ? { token, platform } : null;
  });
}

/** Calls `listener` when FCM rotates the token. Returns the unsubscribe. */
export function onPushTokenRefresh(listener: (token: string) => void): Promise<() => void> {
  return withFirebase(
    () => {},
    async ({ messaging }) => messaging.onTokenRefresh(messaging.getMessaging(), listener),
  );
}

/**
 * Registered at startup (`index.ts` at the app root). With the app in the background or killed,
 * the OS shows notification messages itself; data-only messages would be handled here (none yet).
 */
export function registerBackgroundMessageHandler(): Promise<void> {
  return withFirebase(undefined, async ({ messaging }) => {
    messaging.setBackgroundMessageHandler(messaging.getMessaging(), async () => {});
  });
}
