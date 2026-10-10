import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/**
 * Cross-platform secure key-value storage.
 * Uses hardware keystore on iOS/Android, localStorage on Web.
 */
export async function getSecureItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore web storage errors
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteSecureItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore web storage errors
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

