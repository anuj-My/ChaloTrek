import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

import logo from "../../../public/brand/logo.png";

// The full logo (hiker + "chalotrek."), linking home. Size it with a height
// class; the width follows the image's aspect ratio.
export function Logo({ className, preload }: { className?: string; preload?: boolean }) {
  return (
    <Link href="/" className="inline-flex shrink-0">
      <Image
        src={logo}
        alt={siteConfig.name}
        preload={preload}
        sizes="200px"
        className={cn("h-9 w-auto", className)}
      />
    </Link>
  );
}
