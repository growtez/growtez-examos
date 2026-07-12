/**
 * Generates and persists a unique device identifier in localStorage.
 * This ID is used to track the active exam session per physical device.
 *
 * Using localStorage ensures:
 * - The same device is recognised on app restart/crash (no 60s lockout penalty).
 * - A different browser profile or machine gets a different ID.
 */
export const getDeviceId = (): string => {
  let devId = localStorage.getItem('examos_device_id');
  if (!devId) {
    devId =
      (window.crypto?.randomUUID?.() as string | undefined) ??
      Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('examos_device_id', devId);
  }
  return devId;
};
