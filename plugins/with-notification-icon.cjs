const { withDangerousMod } = require('expo/config-plugins');
const { mkdir, copyFile } = require('node:fs/promises');
const path = require('node:path');

// RNFirebase's Messaging plugin sets the manifest reference but does not copy the icon.
// Generate the drawable through CNG; never maintain android/ manually.
module.exports = function withNotificationIcon(config) {
  return withDangerousMod(config, ['android', async (mod) => {
    const drawable = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/res/drawable');
    await mkdir(drawable, { recursive: true });
    await copyFile(
      path.join(mod.modRequest.projectRoot, 'assets/images/notification-icon.xml'),
      path.join(drawable, 'notification_icon.xml'),
    );
    return mod;
  }]);
};
