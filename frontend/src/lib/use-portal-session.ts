import { useAuth } from "@/lib/auth";
import { isAdminRole, isClientRole, isRecordsRole } from "@/lib/navigation";

export function useRecordsSession() {
  const { user, sessionReady, logout, isAuthLoading } = useAuth();
  const canQuery = sessionReady && Boolean(user && isRecordsRole(user.role));
  return { user, sessionReady, logout, isAuthLoading, canQuery };
}

export function useAdminSession() {
  const { user, sessionReady, logout, isAuthLoading } = useAuth();
  const canQuery = sessionReady && Boolean(user && isAdminRole(user.role));
  return { user, sessionReady, logout, isAuthLoading, canQuery };
}

export function useClientSession() {
  const { user, sessionReady, logout, isAuthLoading } = useAuth();
  const canQuery = sessionReady && Boolean(user && isClientRole(user.role));
  return { user, sessionReady, logout, isAuthLoading, canQuery };
}
