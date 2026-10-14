const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { patchPermissionsService } = require("./apply-expo-permissions-fix.cjs");

const packagePath = require.resolve("expo-modules-core/package.json");
const { version } = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const installedSource = fs.readFileSync(path.join(
  path.dirname(packagePath),
  "android/src/main/java/expo/modules/adapters/react/permissions/PermissionsService.kt"
), "utf8");
// Reconstruct a clean install when postinstall already applied the workaround.
const insertedGuard = `    // Hale: avoid requesting permissions that are already granted.
    if (hasGrantedPermissions(*permissions)) {
      getPermissions(listener, *permissions)
      return
    }
`;
const cleanSource = installedSource.replace(insertedGuard, "");

test("patches the installed SDK 51 service while retaining normal permission requests", () => {
  const patched = patchPermissionsService(cleanSource, version);
  assert.ok(patched.includes(insertedGuard));
  assert.equal(patched.replace(insertedGuard, ""), cleanSource);
});

test("repeated installs do not duplicate the workaround", () => {
  const patched = patchPermissionsService(cleanSource, version);
  assert.equal(patchPermissionsService(patched, version), patched);
});

test("requires review when Expo is upgraded", () => {
  assert.throws(() => patchPermissionsService(cleanSource, "2.0.0"), /Review/);
});

test("fails instead of silently building an unpatched APK when native source changes", () => {
  assert.throws(() => patchPermissionsService("unexpected source", version), /changed/);
});
