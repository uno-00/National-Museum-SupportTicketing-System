import { createFileRoute, redirect } from "@tanstack/react-router";
import { CLIENT_REQUESTS } from "@/lib/navigation";

export const Route = createFileRoute("/client/feedback")({
  beforeLoad: () => {
    throw redirect({ to: CLIENT_REQUESTS, replace: true });
  },
});
