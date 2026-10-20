import Link from "next/link";

import { getMyOrganizer } from "@/features/organizers/queries";

import { getUser } from "../queries";
import { LogoutButton } from "./LogoutButton";

export function LoginLink() {
  return (
    <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
      Log in
    </Link>
  );
}

// Nav links that depend on the session. Render inside <Suspense fallback={<LoginLink />}>.
export async function AccountLinks() {
  const user = await getUser();
  if (!user) return <LoginLink />;
  const organizer = await getMyOrganizer();

  return (
    <div className="flex items-center gap-2">
      {organizer && (
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
          Dashboard
        </Link>
      )}
      <Link href="/my-bookings" className="text-sm text-muted-foreground hover:text-foreground">
        My bookings
      </Link>
      <LogoutButton />
    </div>
  );
}
