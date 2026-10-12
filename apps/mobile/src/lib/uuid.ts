/**
 * Fast RFC4122 v4 UUID generator compatible with React Native Hermes, Web, and Node.
 */
export function generateUUID(): string {
  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    try {
      return globalThis.crypto.randomUUID();
    } catch {
      // Fallback
    }
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Polyfill global crypto.randomUUID if missing in React Native environment
if (typeof globalThis !== "undefined") {
  if (!globalThis.crypto) {
    (globalThis as unknown as { crypto: { randomUUID: () => string } }).crypto = {
      randomUUID: generateUUID,
    };
  } else if (typeof globalThis.crypto.randomUUID !== "function") {
    (globalThis.crypto as { randomUUID: () => string }).randomUUID = generateUUID;
  }
}

