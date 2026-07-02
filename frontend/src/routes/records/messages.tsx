import { createFileRoute } from "@tanstack/react-router";
import { MessengerPage } from "@/components/messages/MessengerPage";

export const Route = createFileRoute("/records/messages")({
  validateSearch: (search: Record<string, unknown>) => ({
    ticket: typeof search.ticket === "string" ? search.ticket : undefined,
    conversation: typeof search.conversation === "string" ? search.conversation : undefined,
  }),
  component: RecordsMessagesPage,
});

function RecordsMessagesPage() {
  const { ticket, conversation } = Route.useSearch();
  return (
    <MessengerPage slot="records" initialTicketId={ticket} initialConversationId={conversation} />
  );
}
