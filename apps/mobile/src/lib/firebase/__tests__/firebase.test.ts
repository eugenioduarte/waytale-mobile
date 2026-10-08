import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PermissionsAndroid, Platform } from 'react-native';

import {
  crashForTesting,
  getPushToken,
  recordError,
  requestPushPermission,
  setAnalyticsUser,
  setDataCollectionEnabled,
  track,
  trackScreen,
} from '@/lib/firebase';

// React Native Firebase's modular API, replaced locally: the native modules don't exist in Jest.
const mockAnalytics = {
  getAnalytics: jest.fn(() => 'analytics'),
  setAnalyticsCollectionEnabled: jest.fn(async () => {}),
  setUserId: jest.fn(async () => {}),
  logEvent: jest.fn(async () => {}),
  logScreenView: jest.fn(async () => {}),
};
const mockCrashlytics = {
  getCrashlytics: jest.fn(() => 'crashlytics'),
  setCrashlyticsCollectionEnabled: jest.fn(async () => {}),
  setUserId: jest.fn(async () => {}),
  log: jest.fn(),
  recordError: jest.fn(),
  crash: jest.fn(),
};
const mockMessaging = {
  getMessaging: jest.fn(() => 'messaging'),
  getToken: jest.fn(async () => 'fcm-token-1'),
  requestPermission: jest.fn(async () => 1),
  AuthorizationStatus: { NOT_DETERMINED: -1, DENIED: 0, AUTHORIZED: 1, PROVISIONAL: 2 },
};
jest.mock('@react-native-firebase/analytics', () => mockAnalytics);
jest.mock('@react-native-firebase/crashlytics', () => mockCrashlytics);
jest.mock('@react-native-firebase/messaging', () => mockMessaging);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('consent', () => {
  it('turns Analytics and Crashlytics collection on and off together', async () => {
    await setDataCollectionEnabled(true);

    expect(mockAnalytics.setAnalyticsCollectionEnabled).toHaveBeenCalledWith('analytics', true);
    expect(mockCrashlytics.setCrashlyticsCollectionEnabled).toHaveBeenCalledWith(
      'crashlytics',
      true,
    );
  });

  it('clears the user id on sign-out', async () => {
    await setAnalyticsUser(null);

    expect(mockAnalytics.setUserId).toHaveBeenCalledWith('analytics', null);
    expect(mockCrashlytics.setUserId).toHaveBeenCalledWith('crashlytics', '');
  });
});

describe('analytics', () => {
  it('logs a product event with its parameters', async () => {
    await track('place_saved', { place_id: 'p1' });

    expect(mockAnalytics.logEvent).toHaveBeenCalledWith('analytics', 'place_saved', {
      place_id: 'p1',
    });
  });

  it('logs screen views by route path', async () => {
    await trackScreen('/profile');

    expect(mockAnalytics.logScreenView).toHaveBeenCalledWith('analytics', {
      screen_name: '/profile',
      screen_class: '/profile',
    });
  });

  it('a failing call never reaches the caller', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockAnalytics.logEvent.mockRejectedValueOnce(new Error('native failure'));

    await expect(track('story_played', { audio_id: 'a1' })).resolves.toBeUndefined();
  });
});

describe('crashlytics', () => {
  it('records a handled error with its context', async () => {
    const error = new Error('sync failed');
    await recordError(error, 'sync');

    expect(mockCrashlytics.log).toHaveBeenCalledWith('crashlytics', 'sync');
    expect(mockCrashlytics.recordError).toHaveBeenCalledWith('crashlytics', error);
  });

  it('wraps a non-Error before recording it', async () => {
    await recordError('boom');

    expect(mockCrashlytics.recordError).toHaveBeenCalledWith('crashlytics', new Error('boom'));
  });

  it('crashes natively on demand', async () => {
    await crashForTesting();

    expect(mockCrashlytics.crash).toHaveBeenCalledWith('crashlytics');
  });
});

describe('push', () => {
  it("returns the device's FCM token and platform", async () => {
    await expect(getPushToken()).resolves.toEqual({
      token: 'fcm-token-1',
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    });
  });

  it('on iOS, asks through Firebase and accepts provisional authorization', async () => {
    mockMessaging.requestPermission.mockResolvedValueOnce(
      mockMessaging.AuthorizationStatus.PROVISIONAL,
    );

    await expect(requestPushPermission()).resolves.toBe(Platform.OS === 'ios');
  });

  it('on Android 13+, asks for the POST_NOTIFICATIONS runtime permission', async () => {
    const os = jest.replaceProperty(Platform, 'OS', 'android');
    const version = jest.spyOn(Platform, 'Version', 'get').mockReturnValue(34);
    const request = jest
      .spyOn(PermissionsAndroid, 'request')
      .mockResolvedValue(PermissionsAndroid.RESULTS.DENIED);

    await expect(requestPushPermission()).resolves.toBe(false);
    expect(request).toHaveBeenCalledWith(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);

    os.restore();
    version.mockRestore();
  });
});
