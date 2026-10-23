import { Suspense } from "react";

import { DashboardShell } from "@/components/shared/DashboardShell";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { RequireAdmin } from "@/features/auth/components/RequireUser";

const nav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/organizers", label: "Organizers" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/refunds", label: "Refunds" },
];

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <DashboardShell title="Admin" nav={nav} footer={<LogoutButton />}>
      <Suspense fallback={<PageSkeleton />}>
        <RequireAdmin>{children}</RequireAdmin>
      </Suspense>
    </DashboardShell>
  );
}
