import { Suspense } from "react";

import { SiteFooter } from "@/components/shared/SiteFooter";
import { SiteNav } from "@/components/shared/SiteNav";
import { AccountLinks, LoginLink } from "@/features/auth/components/AccountLinks";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteNav
        actions={
          <Suspense fallback={<LoginLink />}>
            <AccountLinks />
          </Suspense>
        }
      />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
