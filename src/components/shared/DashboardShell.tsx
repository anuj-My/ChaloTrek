import Link from "next/link";

import { Logo } from "./Logo";

type NavItem = { href: string; label: string };

export function DashboardShell({
  title,
  nav,
  footer,
  children,
}: {
  title: string;
  nav: NavItem[];
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <aside className="flex flex-col border-b md:w-56 md:border-r md:border-b-0">
        <div className="space-y-1 px-4 py-4">
          <Logo className="h-10" />
          <p className="eyebrow">{title}</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm whitespace-nowrap text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {footer && <div className="px-2 pb-2 md:mt-auto">{footer}</div>}
      </aside>
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
