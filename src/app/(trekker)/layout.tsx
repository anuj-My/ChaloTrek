import { Suspense } from "react";

import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { SiteNav } from "@/components/shared/SiteNav";
import { AccountLinks, LoginLink } from "@/features/auth/components/AccountLinks";
import { RequireUser } from "@/features/auth/components/RequireUser";

export default function TrekkerLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteNav
        actions={
          <Suspense fallback={<LoginLink />}>
            <AccountLinks />
          </Suspense>
        }
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">
        <Suspense fallback={<PageSkeleton />}>
          <RequireUser next="/my-bookings">{children}</RequireUser>
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
