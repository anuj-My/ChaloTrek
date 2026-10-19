import { DashboardShell } from "@/components/shared/DashboardShell";

const nav = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/treks", label: "Treks" },
  { href: "/dashboard/batches", label: "Batches" },
  { href: "/dashboard/bookings", label: "Bookings" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <DashboardShell title="Organizer" nav={nav}>
      {children}
    </DashboardShell>
  );
}
