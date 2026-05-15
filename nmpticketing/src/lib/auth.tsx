import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const AUTH_SESSION_KEY = "nmp_authenticated";

/** Used when `VITE_AUTH_USERNAME` is not set */
export const DEFAULT_AUTH_USERNAME = "nmp";
/** Used when `VITE_AUTH_PASSWORD` is not set */
export const DEFAULT_AUTH_PASSWORD = "nmp";

export function getSessionAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(AUTH_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function persistSession(active: boolean) {
  try {
    if (active) sessionStorage.setItem(AUTH_SESSION_KEY, "1");
    else sessionStorage.removeItem(AUTH_SESSION_KEY);
  } catch {
    /* private mode / blocked storage */
  }
}

export function checkCredentials(username: string, password: string): boolean {
  const u = String(import.meta.env.VITE_AUTH_USERNAME ?? DEFAULT_AUTH_USERNAME).trim();
  const p = String(import.meta.env.VITE_AUTH_PASSWORD ?? DEFAULT_AUTH_PASSWORD).trim();
  return username.trim() === u && password.trim() === p;
}

type AuthContextValue = {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(getSessionAuthenticated);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.storageArea !== sessionStorage || e.key !== AUTH_SESSION_KEY) return;
      setIsAuthenticated(e.newValue === "1");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = useCallback((username: string, password: string) => {
    if (!checkCredentials(username, password)) return false;
    persistSession(true);
    setIsAuthenticated(true);
    return true;
  }, []);

  const logout = useCallback(() => {
    persistSession(false);
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, login, logout }),
    [isAuthenticated, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
