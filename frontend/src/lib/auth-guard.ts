import { redirect } from "@tanstack/react-router";
import { getAuthToken } from "@/lib/api/client";
import { LOGIN } from "@/lib/navigation";

export function ensureAuthenticated() {
  if (!getAuthToken()) {
    throw redirect({ to: LOGIN, replace: true });
  }
}
