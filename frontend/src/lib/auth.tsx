import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouterState } from "@tanstack/react-router";
import { api, ApiError } from "@/lib/api/client";
import type { ApiUser } from "@/lib/api/types";
import { queryClient } from "@/lib/query-client";
import {
  AUTH_CHANGED_EVENT,
  getSession,
  listSessions,
  pathToSlot,
  roleToSlot,
  SESSIONS_STORAGE_KEY,
  setSession,
  type PortalSlot,
} from "@/lib/sessions";

type AuthContextValue = {
  /** User for the portal matching the current URL (null on /login, /, etc.) */
  user: ApiUser | null;
  activeSlot: PortalSlot | null;
  /** Saved logins per portal — admin, records, and client can all stay signed in */
  sessions: Partial<Record<PortalSlot, ApiUser>>;
  isAuthenticated: boolean;
  sessionReady: boolean;
  isAuthLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<ApiUser | null>;
  logout: (slot?: PortalSlot) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readSessionsMap(): Partial<Record<PortalSlot, ApiUser>> {
  const map: Partial<Record<PortalSlot, ApiUser>> = {};
  for (const { slot, user } of listSessions()) {
    map[slot] = user;
  }
  return map;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeSlot = pathToSlot(pathname);

  const [sessions, setSessions] = useState<Partial<Record<PortalSlot, ApiUser>>>(() =>
    readSessionsMap(),
  );
  const [user, setUser] = useState<ApiUser | null>(() =>
    activeSlot ? (getSession(activeSlot)?.user ?? null) : null,
  );
  const [sessionReady, setSessionReady] = useState(() => !activeSlot);
  const [isAuthLoading, setIsAuthLoading] = useState(() => Boolean(activeSlot));
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => listSessions().length > 0,
  );

  useEffect(() => {
    let cancelled = false;
    let syncGen = 0;

    const sync = (slot: PortalSlot | null) => {
      const gen = ++syncGen;
      const all = readSessionsMap();
      if (!cancelled) {
        setSessions(all);
        setIsAuthenticated(Object.keys(all).length > 0);
      }

      if (!slot) {
        if (!cancelled) {
          setUser(null);
          setSessionReady(true);
          setIsAuthLoading(false);
        }
        return;
      }

      const saved = getSession(slot);
      if (!saved?.token) {
        if (!cancelled) {
          setUser(null);
          setSessionReady(true);
          setIsAuthLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setIsAuthLoading(true);
        setSessionReady(false);
      }

      api
        .me(slot)
        .then(({ user: u }) => {
          if (cancelled || gen !== syncGen) return;
          setSession(slot, { token: saved.token, user: u });
          setSessions(readSessionsMap());
          setUser(u);
          setSessionReady(true);
        })
        .catch((err) => {
          if (cancelled || gen !== syncGen) return;
          if (err instanceof ApiError && err.status === 401) {
            setSession(slot, null);
            setSessions(readSessionsMap());
            setUser(null);
          } else {
            setUser(saved.user);
          }
          setSessionReady(true);
        })
        .finally(() => {
          if (!cancelled && gen === syncGen) setIsAuthLoading(false);
        });
    };

    const onAuthChanged = () => {
      const slot = pathToSlot(window.location.pathname);
      void queryClient.invalidateQueries();
      sync(slot);
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === SESSIONS_STORAGE_KEY) onAuthChanged();
    };

    sync(activeSlot);
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    window.addEventListener("storage", onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, [activeSlot]);

  const login = useCallback(async (usernameOrEmail: string, password: string) => {
    const email = usernameOrEmail.includes("@")
      ? usernameOrEmail.trim().toLowerCase()
      : `${usernameOrEmail.trim()}@nmp.gov.ph`.toLowerCase();
    try {
      const { token, user: u } = await api.login(email, password);
      const slot = roleToSlot(u.role);
      setSession(slot, { token, user: u });

      const all = readSessionsMap();
      setSessions(all);
      setIsAuthenticated(true);

      const currentSlot = pathToSlot(window.location.pathname);
      if (currentSlot === slot) {
        setUser(u);
        setSessionReady(true);
        setIsAuthLoading(false);
      }

      return u;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return null;
      if (err instanceof ApiError) throw new Error(err.message);
      throw new Error(
        "Cannot reach the API server. Make sure the backend is running (npm run start).",
      );
    }
  }, []);

  const logout = useCallback(
    (slot?: PortalSlot) => {
      const target = slot ?? activeSlot;
      if (!target) return;
      setSession(target, null);
      setSessions(readSessionsMap());
      setIsAuthenticated(listSessions().length > 0);
      if (target === activeSlot) {
        setUser(null);
        setSessionReady(true);
        setIsAuthLoading(false);
      }
      void queryClient.invalidateQueries();
    },
    [activeSlot],
  );

  const value = useMemo(
    () => ({
      isAuthenticated,
      sessionReady,
      isAuthLoading,
      user,
      activeSlot,
      sessions,
      login,
      logout,
    }),
    [isAuthenticated, sessionReady, isAuthLoading, user, activeSlot, sessions, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
