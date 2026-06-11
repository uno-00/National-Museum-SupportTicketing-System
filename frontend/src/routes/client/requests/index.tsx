import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export const Route = createFileRoute("/client/requests/")({
  component: MyRequestsPage,
});

function MyRequestsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-tickets"],
    queryFn: () => api.myTickets(),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">My Requests</h1>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Form</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center">Loading…</td></tr>
            ) : (data?.items ?? []).length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No requests yet.</td></tr>
            ) : (
              data?.items.map((t) => (
                <tr key={t._id} className="border-t">
                  <td className="px-4 py-3 font-mono text-xs">{t.ticketNumber}</td>
                  <td className="px-4 py-3">{t.formTitle}</td>
                  <td className="px-4 py-3 capitalize">{t.status.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link to="/client/requests/$ticketId" params={{ ticketId: t._id }} className="text-maroon hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
