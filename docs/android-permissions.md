# Camera and microphone permissions on Android 16 and later

Hale currently builds with Expo SDK 51, React Native 0.74.2, and
expo-modules-core 1.12.26. On some Android 16 devices, requesting a permission
that is already granted can leave the request pending until the app is
backgrounded. See https://github.com/expo/expo/issues/39480. Hale's connected
Pixel also showed a pending audio permission request on Android 17 while the
OS already reported RECORD_AUDIO as granted.

Meal capture reads the current OS permission before requesting access. It
requests only if access is missing and the OS permits another prompt; blocked
access offers an Open Settings action. It also prevents overlapping capture
actions and cleans up a recorder created after the sheet closes.

The SDK 51 image picker also requests permission inside its native camera
launcher. The repository's postinstall runs
`patches/apply-expo-permissions-fix.cjs` to update the installed Android
permission service: when **all** requested permissions are already granted,
return their current status without requesting them again. Missing permissions
still use the original native request. This runs on EAS installs as well as
local installs and requires a new native APK, not just a JavaScript reload.

The patch supports only the locked expo-modules-core 1.12.26 version. A version
or source change fails installation so the workaround must be reviewed during
an Expo upgrade. Remove the postinstall patch and its files once the upgraded
native stack has been verified on affected devices.

From the repository root, verify with:

```sh
node --import tsx --test apps/mobile/tests/capture-permissions.test.ts patches/apply-expo-permissions-fix.test.cjs
npm run typecheck --workspace=@hale/mobile
```

Rebuild from `apps/mobile` using the preview EAS profile. The install log should
contain `[HalePermissions] Granted-permission workaround ready`. On the Pixel, verify
camera and voice on first use, repeated use, cancellation, sheet closure during
permission approval, denied access, and returning after changing permissions
in Settings. The `[HaleCapture]` logs should reach `recording:created` or
`camera-launch:start`; camera result logs appear when the camera returns.
