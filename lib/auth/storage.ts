"use client";

export type AuthTokens = {
  token: string;
  refreshToken: string;
  refreshExpiresIn?: number | null;
};

const TOKEN_KEY = "glycolink.token";
const LEGACY_ACCESS_TOKEN_KEY = "glycolink.accessToken";
const REFRESH_TOKEN_KEY = "glycolink.refreshToken";
const REFRESH_EXPIRES_IN_KEY = "glycolink.refreshExpiresIn";

let inMemoryTokens: AuthTokens | null = null;
const listeners = new Set<() => void>();

function canUseStorage() {
  return typeof window !== "undefined";
}

function readTokensFromStorage(): AuthTokens | null {
  if (!canUseStorage()) {
    return inMemoryTokens;
  }

  const token =
    window.localStorage.getItem(TOKEN_KEY) ??
    window.localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY);
  const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY);
  const refreshExpiresRaw = window.localStorage.getItem(REFRESH_EXPIRES_IN_KEY);
  const refreshExpiresIn = refreshExpiresRaw ? Number.parseInt(refreshExpiresRaw, 10) : null;

  if (!token || !refreshToken) {
    return null;
  }

  return {
    token,
    refreshToken,
    refreshExpiresIn: Number.isFinite(refreshExpiresIn) ? refreshExpiresIn : null,
  };
}

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export function getStoredTokens(): AuthTokens | null {
  if (inMemoryTokens) {
    return inMemoryTokens;
  }

  const storedTokens = readTokensFromStorage();
  inMemoryTokens = storedTokens;
  return storedTokens;
}

export function getAccessToken() {
  return getStoredTokens()?.token ?? null;
}

export function getToken() {
  return getStoredTokens()?.token ?? null;
}

export function getRefreshToken() {
  return getStoredTokens()?.refreshToken ?? null;
}

export function setStoredTokens(tokens: AuthTokens) {
  inMemoryTokens = tokens;

  if (canUseStorage()) {
    window.localStorage.setItem(TOKEN_KEY, tokens.token);
    window.localStorage.setItem(LEGACY_ACCESS_TOKEN_KEY, tokens.token);
    window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    if (typeof tokens.refreshExpiresIn === "number") {
      window.localStorage.setItem(REFRESH_EXPIRES_IN_KEY, String(tokens.refreshExpiresIn));
    } else {
      window.localStorage.removeItem(REFRESH_EXPIRES_IN_KEY);
    }
  }

  notifyListeners();
}

export function clearStoredTokens() {
  inMemoryTokens = null;

  if (canUseStorage()) {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_EXPIRES_IN_KEY);
  }

  notifyListeners();
}

export function subscribeToAuthChanges(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
