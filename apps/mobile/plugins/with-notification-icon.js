const fs = require('node:fs');
const path = require('node:path');

const { AndroidConfig, withAndroidColors, withDangerousMod } = require('expo/config-plugins');

/**
 * Android notification icon for pushes (EPIC-01.12). The `@react-native-firebase/messaging` plugin
 * points FCM at `@drawable/notification_icon` and `@color/notification_icon_color`, expecting Expo
 * to create them — Expo SDK 55+ no longer does (the app config `notification` field is gone), and
 * `expo-notifications` would register a second FCM service that competes with Firebase's.
 *
 * So this creates both from the messaging plugin's own options (one source):
 *   ["@react-native-firebase/messaging", { "android": { "notificationIcon", "notificationColor" } }]
 * The icon must be white on transparent (Android tints it).
 */
function messagingOptions(config) {
  const entry = (config.plugins ?? []).find(
    (plugin) => Array.isArray(plugin) && plugin[0] === '@react-native-firebase/messaging',
  );
  const android = entry?.[1]?.android;
  if (!android?.notificationIcon || !android?.notificationColor) {
    throw new Error(
      'with-notification-icon: set android.notificationIcon and notificationColor on the @react-native-firebase/messaging plugin',
    );
  }
  return { icon: android.notificationIcon, color: android.notificationColor };
}

module.exports = function withNotificationIcon(config) {
  const { icon, color } = messagingOptions(config);

  config = withAndroidColors(config, (modConfig) => {
    modConfig.modResults = AndroidConfig.Colors.assignColorValue(modConfig.modResults, {
      name: 'notification_icon_color',
      value: color,
    });
    return modConfig;
  });

  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const { projectRoot, platformProjectRoot } = modConfig.modRequest;
      const drawable = path.join(platformProjectRoot, 'app', 'src', 'main', 'res', 'drawable');
      fs.mkdirSync(drawable, { recursive: true });
      fs.copyFileSync(
        path.resolve(projectRoot, icon),
        path.join(drawable, 'notification_icon.png'),
      );
      return modConfig;
    },
  ]);
};
