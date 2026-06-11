import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { CLIENT_SUBMIT } from "@/lib/navigation";

export const Route = createFileRoute("/client/forms")({
  component: AvailableFormsPage,
});

function AvailableFormsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["published-forms"],
    queryFn: () => api.publishedForms(),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Available Forms</h1>
      <p className="text-sm text-muted-foreground">Approved technical assistance forms you can submit.</p>
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (data?.items ?? []).length === 0 ? (
        <p className="text-muted-foreground">No published forms yet.</p>
      ) : (
        <ul className="space-y-3">
          {data?.items.map((f) => (
            <li key={f._id} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.refNumber}</p>
              </div>
              <Link
                to={CLIENT_SUBMIT}
                search={{ formId: f._id }}
                className="text-sm text-maroon hover:underline"
              >
                Use form
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
