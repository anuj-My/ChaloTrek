import Link from "next/link";

import { ActionButton } from "@/components/shared/ActionButton";

import { deleteDestination } from "../actions";
import { listDestinationsForAdmin } from "../queries";
import { DestinationForm } from "./DestinationForm";

// Admin: the treks organizers can link to, each with a comparison page.
export async function AdminDestinations() {
  const destinations = await listDestinationsForAdmin();

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Destinations</h1>
        <p className="text-muted-foreground">
          Organizers pick one of these for each trek, which lists it on the trek&apos;s comparison page. Add a short
          description to help those pages rank in search.
        </p>
      </div>

      <section className="space-y-4 rounded-xl border p-5">
        <h2 className="font-heading text-lg font-semibold">Add a trek</h2>
        <DestinationForm />
      </section>

      <ul className="divide-y rounded-lg border">
        {destinations.map((d) => (
          <li key={d.id} className="p-4 text-sm">
            <details className="group">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
                <span>
                  <span className="font-medium">{d.name}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {d.region} · {d.trekCount} {d.trekCount === 1 ? "trek" : "treks"}
                    {!d.summary && " · no description"}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <Link href={`/treks/${d.slug}`} target="_blank" className="underline underline-offset-4">
                    /treks/{d.slug}
                  </Link>
                  <span className="text-muted-foreground group-open:hidden">Edit</span>
                </span>
              </summary>
              <div className="space-y-4 pt-4">
                <DestinationForm destination={d} />
                <ActionButton
                  action={deleteDestination}
                  fields={{ destination_id: d.id }}
                  variant="ghost"
                  confirm={`Delete ${d.name}? ${d.trekCount} linked ${d.trekCount === 1 ? "trek keeps" : "treks keep"} working but leave its comparison page.`}
                >
                  Delete
                </ActionButton>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
