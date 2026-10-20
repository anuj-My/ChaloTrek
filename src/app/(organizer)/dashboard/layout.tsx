import { Suspense } from "react";

import { DashboardShell } from "@/components/shared/DashboardShell";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { RequireUser } from "@/features/auth/components/RequireUser";

const nav = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/treks", label: "Treks" },
  { href: "/dashboard/batches", label: "Batches" },
  { href: "/dashboard/bookings", label: "Bookings" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <DashboardShell title="Organizer" nav={nav} footer={<LogoutButton />}>
      <Suspense fallback={<PageSkeleton />}>
        <RequireUser next="/dashboard">{children}</RequireUser>
      </Suspense>
    </DashboardShell>
  );
}
