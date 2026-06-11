import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export const Route = createFileRoute("/admin/requests/")({
  component: RequestsPage,
});

function RequestsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["all-tickets"],
    queryFn: () => api.listTickets(),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Request Management</h1>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">No.</th>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center">Loading…</td></tr>
            ) : (
              data?.items.map((t, i) => (
                <tr key={t._id} className="border-t">
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{t.title}</td>
                  <td className="px-4 py-3">{t.creatorName}</td>
                  <td className="px-4 py-3 capitalize">{t.status.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3">
                    <Link to="/admin/requests/$ticketId" params={{ ticketId: t._id }} className="text-maroon hover:underline">
                      Manage
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
