import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useRecordsSession } from "@/lib/use-portal-session";

export const Route = createFileRoute("/records/published")({
  component: PublishedFormsPage,
});

function PublishedFormsPage() {
  const { canQuery } = useRecordsSession();
  const { data, isLoading } = useQuery({
    queryKey: ["records-published"],
    queryFn: () => api.recordsForms({ status: "published" }),
    enabled: canQuery,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Published Forms</h1>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">No.</th>
              <th className="px-4 py-3">Form Description</th>
              <th className="px-4 py-3">Ref</th>
              <th className="px-4 py-3">Effectivity</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center">Loading…</td></tr>
            ) : (data?.items ?? []).length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No published forms.</td></tr>
            ) : (
              data?.items.map((row, i) => (
                <tr key={row._id} className="border-t">
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{row.title}</td>
                  <td className="px-4 py-3 font-mono text-xs">{row.refNumber}</td>
                  <td className="px-4 py-3">{row.effectivity}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
