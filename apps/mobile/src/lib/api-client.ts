import { Platform } from "react-native";
import {
  getSecureItem,
  setSecureItem,
  deleteSecureItem,
} from "./secure-storage";
import type { SessionResponse } from "@hale/shared";

function getBaseUrl(): string {
  if (process.env["EXPO_PUBLIC_API_URL"]) {
    return process.env["EXPO_PUBLIC_API_URL"];
  }
  // On web running in browser, connect to localhost:3001
  if (Platform.OS === "web") {
    return "http://localhost:3001/v1";
  }
  // On physical Android device, connect to local network IP
  return "http://192.168.1.77:3001/v1";
}

const API_BASE_URL = getBaseUrl();

const SESSION_TOKEN_KEY = "hale_session_token";
const DEVICE_SECRET_KEY = "hale_device_secret";

class ApiClient {
  private token: string | null = null;

  async getToken(): Promise<string> {
    if (this.token) return this.token;
    let stored = await getSecureItem(SESSION_TOKEN_KEY);
    if (!stored) {
      // Create session
      stored = await this.initAnonymousSession();
    }
    this.token = stored;
    return stored;
  }

  private async initAnonymousSession(): Promise<string> {
    let secret = await getSecureItem(DEVICE_SECRET_KEY);
    if (!secret) {
      secret =
        "sec_" +
        Math.random().toString(36).substring(2) +
        Date.now().toString(36);
      await setSecureItem(DEVICE_SECRET_KEY, secret);
    }

    const res = await fetch(`${API_BASE_URL}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceSecretHash: secret,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to create session: ${res.statusText}`);
    }

    const data = (await res.json()) as SessionResponse;
    await setSecureItem(SESSION_TOKEN_KEY, data.token);
    return data.token;
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getToken();
    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${token}`);
    if (
      options.body &&
      !headers.has("Content-Type") &&
      !(options.body instanceof FormData)
    ) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Auto-heal stale or invalid session token (e.g., when switching between databases)
      if (response.status === 401 && path !== "/sessions") {
        console.warn(
          "⚠️ Invalid or expired session token. Re-initializing session...",
        );
        await this.resetSession();
        const freshToken = await this.getToken();
        headers.set("Authorization", `Bearer ${freshToken}`);
        const retryResponse = await fetch(`${API_BASE_URL}${path}`, {
          ...options,
          headers,
        });
        if (retryResponse.ok) {
          return (await retryResponse.json()) as T;
        }
      }

      let errMessage = `Request failed: ${response.statusText}`;
      try {
        const errorJson = (await response.json()) as { message?: string };
        if (errorJson.message) errMessage = errorJson.message;
      } catch {
        // Fallback to status text
      }
      throw new Error(errMessage);
    }

    return (await response.json()) as T;
  }

  get<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  post<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  uploadFormData<T>(path: string, formData: FormData, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: "POST",
      body: formData,
    });
  }

  put<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }

  async resetSession(): Promise<void> {
    await deleteSecureItem(SESSION_TOKEN_KEY);
    await deleteSecureItem(DEVICE_SECRET_KEY);
    this.token = null;
  }
}

export const api = new ApiClient();
