import { createFileRoute } from "@tanstack/react-router";
import { ClientSubmitForm } from "@/components/client/ClientSubmitForm";

export const Route = createFileRoute("/client/submit")({
  validateSearch: (s: Record<string, unknown>) => ({
    formId: typeof s.formId === "string" ? s.formId : undefined,
  }),
  component: () => {
    const { formId } = Route.useSearch();
    return <ClientSubmitForm initialFormId={formId} />;
  },
});
