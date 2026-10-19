import { DashboardShell } from "@/components/shared/DashboardShell";

const nav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/organizers", label: "Organizers" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/refunds", label: "Refunds" },
];

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <DashboardShell title="Admin" nav={nav}>
      {children}
    </DashboardShell>
  );
}
