interface CapturePermission {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}

/** Check first: repeated native requests can hang on Android 16+ / SDK 51. */
export async function resolveCapturePermission<T extends CapturePermission>(
  getPermission: () => Promise<T>,
  requestPermission: () => Promise<T>,
  log: (message: string) => void = () => {},
): Promise<T> {
  log("permission:check");
  let permission = await getPermission();
  log(`permission:checked status=${permission.status} canAskAgain=${permission.canAskAgain}`);
  if (!permission.granted && permission.canAskAgain) {
    log("permission:request");
    permission = await requestPermission();
  }
  log(`permission:resolved status=${permission.status} canAskAgain=${permission.canAskAgain}`);
  return permission;
}
