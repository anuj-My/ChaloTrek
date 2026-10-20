import { requireAdmin, requireUser } from "../queries";

// Server-side guards for layouts. Render them inside <Suspense>, since they
// read the session cookie at request time.
export async function RequireUser({ next, children }: { next: string; children: React.ReactNode }) {
  await requireUser(next);
  return children;
}

export async function RequireAdmin({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return children;
}
