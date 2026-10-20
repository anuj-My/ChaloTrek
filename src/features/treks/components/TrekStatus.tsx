import { ActionButton } from "@/components/shared/ActionButton";
import { Badge } from "@/components/ui/badge";
import type { MyOrganizer } from "@/features/organizers/queries";

import { setTrekStatus } from "../actions";
import type { MyTrek } from "../queries";

export function TrekStatusBadge({ status }: { status: MyTrek["status"] }) {
  if (status === "published") return <Badge>Published</Badge>;
  if (status === "archived") return <Badge variant="secondary">Archived</Badge>;
  return <Badge variant="outline">Draft</Badge>;
}

// Publish / unpublish / archive, with a note on what the status means.
export function TrekStatusPanel({ trek, organizer }: { trek: MyTrek; organizer: MyOrganizer }) {
  const fields = (status: string) => ({ trek_id: trek.id, status });
  const approved = organizer.kyc_status === "approved";

  let note: string;
  if (trek.status === "draft") note = "Only you can see this trek. Publish it when it's ready.";
  else if (trek.status === "archived") note = "Hidden from everyone. Restore it as a draft to edit or publish again.";
  else if (approved) note = "Live. Trekkers can see it and book open batches.";
  else note = "Published, but it goes live only once your KYC is approved.";

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">Status</p>
          <TrekStatusBadge status={trek.status} />
        </div>
        <p className="text-sm text-muted-foreground">{note}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {trek.status === "draft" && (
          <ActionButton action={setTrekStatus} fields={fields("published")} variant="default">
            Publish
          </ActionButton>
        )}
        {trek.status === "published" && (
          <ActionButton action={setTrekStatus} fields={fields("draft")}>
            Unpublish
          </ActionButton>
        )}
        {trek.status !== "archived" ? (
          <ActionButton
            action={setTrekStatus}
            fields={fields("archived")}
            variant="ghost"
            confirm="Archive this trek? It will be hidden from everyone."
          >
            Archive
          </ActionButton>
        ) : (
          <ActionButton action={setTrekStatus} fields={fields("draft")}>
            Restore as draft
          </ActionButton>
        )}
      </div>
    </div>
  );
}
