import { create } from "zustand";
import { api, configureApiClient, ApiError } from "@/lib/api/client";

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

interface ProfileResponse {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  emailVerified: boolean;
  createdAt: string;
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
      const profile = await api.get<ProfileResponse>("/users/me");
      set({ user: toAuthUser(profile), isInitialized: true });
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
