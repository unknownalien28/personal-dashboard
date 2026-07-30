import { create } from "zustand";
import { api, configureApiClient, ApiError } from "@/lib/api/client";
import { useProfileStore } from "@/features/profile/profile-store";

export interface AuthUser {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  emailVerified: boolean;
  createdAt: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/** Nested profile sub-object as returned by GET /users/me. */
interface BackendProfile {
  name?: string;
  role?: string;
  avatarColor?: string;
  avatarDataUrl?: string | null;
  email?: string;
  bio?: string;
  timezone?: string;
  language?: string;
}

interface ProfileResponse {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  emailVerified: boolean;
  createdAt: string;
  profile?: BackendProfile | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  /** True once the initial session hydration (from a stored refresh token) has finished, success or not. */
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  register: (email: string, password: string, name?: string) => Promise<void>;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  clearError: () => void;
}

const REFRESH_TOKEN_KEY = "alienos.refreshToken";

function readStoredRefreshToken(): { token: string; remember: boolean } | null {
  const persisted = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (persisted) return { token: persisted, remember: true };
  const session = sessionStorage.getItem(REFRESH_TOKEN_KEY);
  if (session) return { token: session, remember: false };
  return null;
}

function storeRefreshToken(token: string, remember: boolean) {
  if (remember) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  } else {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

function clearStoredRefreshToken() {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

function toAuthUser(profile: ProfileResponse): AuthUser {
  return { id: profile.id, email: profile.email, role: profile.role, emailVerified: profile.emailVerified, createdAt: profile.createdAt };
}

/**
 * Seeds the existing (local-first) profile store from the backend's nested
 * `profile` object — this is the ONE place the profile is synced from the
 * server, called once per login/register/hydrate. Every page (greeting,
 * avatar, ProfilePage) keeps reading from `useProfileStore`, so there's a
 * single global source of truth instead of a second competing store.
 * Only non-empty backend fields overwrite local ones, so a brand-new
 * account's blank profile doesn't stomp a friendlier local placeholder.
 */
function syncProfileFromBackend(profile?: BackendProfile | null): void {
  if (!profile) return;
  const updates: Record<string, unknown> = {};
  if (profile.name) updates.name = profile.name;
  if (profile.role) updates.role = profile.role;
  if (profile.avatarColor) updates.avatarColor = profile.avatarColor;
  if (profile.avatarDataUrl) updates.avatarDataUrl = profile.avatarDataUrl;
  if (profile.email) updates.email = profile.email;
  if (profile.bio) updates.bio = profile.bio;
  if (profile.timezone) updates.timezone = profile.timezone;
  if (profile.language) updates.language = profile.language;
  if (Object.keys(updates).length > 0) {
    useProfileStore.getState().updateProfile(updates);
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isInitialized: false,
  isLoading: false,
  error: null,

  async register(email, password, name) {
    set({ isLoading: true, error: null });
    try {
      const result = await api.post<{ user: ProfileResponse; tokens: TokenPair }>(
        "/auth/register",
        { email, password, name },
        { skipAuth: true },
      );
      storeRefreshToken(result.tokens.refreshToken, false);
      set({ user: toAuthUser(result.user), accessToken: result.tokens.accessToken, isLoading: false });
      // Register's response doesn't include the nested profile — fetch it once, now.
      const full = await api.get<ProfileResponse>("/users/me").catch(() => null);
      if (full) syncProfileFromBackend(full.profile);
    } catch (err) {
      set({ isLoading: false, error: errorMessage(err) });
      throw err;
    }
  },

  async login(email, password, rememberMe) {
    set({ isLoading: true, error: null });
    try {
      const result = await api.post<{ user: ProfileResponse; tokens: TokenPair }>(
        "/auth/login",
        { email, password, rememberMe },
        { skipAuth: true },
      );
      storeRefreshToken(result.tokens.refreshToken, rememberMe);
      set({ user: toAuthUser(result.user), accessToken: result.tokens.accessToken, isLoading: false });
      const full = await api.get<ProfileResponse>("/users/me").catch(() => null);
      if (full) syncProfileFromBackend(full.profile);
    } catch (err) {
      set({ isLoading: false, error: errorMessage(err) });
      throw err;
    }
  },

  async logout() {
    const stored = readStoredRefreshToken();
    clearStoredRefreshToken();
    set({ user: null, accessToken: null });
    if (stored) {
      try {
        await api.post("/auth/logout", { refreshToken: stored.token }, { skipAuth: true });
      } catch {
        // Best-effort — the local session is already cleared either way.
      }
    }
  },

  /** Called once on app boot: tries to turn a stored refresh token into a live session. */
  async hydrate() {
    const stored = readStoredRefreshToken();
    if (!stored) {
      set({ isInitialized: true });
      return;
    }
    try {
      const tokens = await api.post<TokenPair>("/auth/refresh", { refreshToken: stored.token }, { skipAuth: true });
      storeRefreshToken(tokens.refreshToken, stored.remember);
      set({ accessToken: tokens.accessToken });
      // Single fetch serves both the auth-user fields and the profile sync below.
      const profile = await api.get<ProfileResponse>("/users/me");
      set({ user: toAuthUser(profile), isInitialized: true });
      syncProfileFromBackend(profile.profile);
    } catch {
      clearStoredRefreshToken();
      set({ user: null, accessToken: null, isInitialized: true });
    }
  },

  clearError() {
    set({ error: null });
  },
}));

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}

// Wire the API client's token/refresh hooks to this store, once, at module load.
configureApiClient({
  getAccessToken: () => useAuthStore.getState().accessToken,
  onUnauthorized: () => {
    clearStoredRefreshToken();
    useAuthStore.setState({ user: null, accessToken: null });
  },
  refresh: async () => {
    const stored = readStoredRefreshToken();
    if (!stored) return null;
    try {
      const tokens = await api.post<TokenPair>("/auth/refresh", { refreshToken: stored.token }, { skipAuth: true });
      storeRefreshToken(tokens.refreshToken, stored.remember);
      useAuthStore.setState({ accessToken: tokens.accessToken });
      return tokens.accessToken;
    } catch {
      clearStoredRefreshToken();
      useAuthStore.setState({ user: null, accessToken: null });
      return null;
    }
  },
});
