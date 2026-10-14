const fs = require("node:fs");
const path = require("node:path");

// Expo SDK 51 workaround for Android 16 and later. An already-granted request
// can wait for a lifecycle callback that never happens without backgrounding.
// The image picker requests permission internally, so JS checks alone cannot
// fix camera launch. Remove this workaround when upgrading Expo and validating
// camera + voice on Android 16. https://github.com/expo/expo/issues/39480
const supportedVersion = "1.12.26";
const originalMethod = `  protected open fun askForManifestPermissions(permissions: Array<out String>, listener: PermissionsResponseListener) {
    delegateRequestToActivity(permissions, listener)
  }`;
const patchedMethod = `  protected open fun askForManifestPermissions(permissions: Array<out String>, listener: PermissionsResponseListener) {
    // Hale: avoid requesting permissions that are already granted.
    if (hasGrantedPermissions(*permissions)) {
      getPermissions(listener, *permissions)
      return
    }
    delegateRequestToActivity(permissions, listener)
  }`;

function patchPermissionsService(source, version) {
  if (version !== supportedVersion) {
    throw new Error(
      `Review the Android permission workaround for expo-modules-core ${version}; expected ${supportedVersion}.`
    );
  }
  if (source.includes(patchedMethod)) return source;
  if (source.split(originalMethod).length !== 2) {
    throw new Error("Cannot apply the Android permission workaround: PermissionsService.kt changed.");
  }
  return source.replace(originalMethod, patchedMethod);
}

function applyInstalledPatch() {
  const packagePath = require.resolve("expo-modules-core/package.json", {
    paths: [path.resolve(__dirname, "../apps/mobile")],
  });
  const { version } = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  const sourcePath = path.join(
    path.dirname(packagePath),
    "android/src/main/java/expo/modules/adapters/react/permissions/PermissionsService.kt"
  );
  const source = fs.readFileSync(sourcePath, "utf8");
  const patched = patchPermissionsService(source, version);
  if (patched !== source) fs.writeFileSync(sourcePath, patched);
  console.info(`[HalePermissions] Granted-permission workaround ready (expo-modules-core ${version}).`);
}

module.exports = { patchPermissionsService };
if (require.main === module) applyInstalledPatch();
