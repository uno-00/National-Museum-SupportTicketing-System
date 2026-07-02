import { createFileRoute } from "@tanstack/react-router";
import { UnifiedLoginPage } from "@/components/auth/UnifiedLoginPage";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({ meta: [{ title: "Log in — TARF System" }] }),
  component: UnifiedLoginPage,
});
