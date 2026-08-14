"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import { needsFullDocumentNavigation } from "@/lib/google-tags-route";

type PrivacyBoundaryLinkProps = ComponentProps<"a"> & {
  href: string;
};

export function PrivacyBoundaryLink({
  href,
  children,
  ...props
}: PrivacyBoundaryLinkProps) {
  const pathname = usePathname() || "";

  if (needsFullDocumentNavigation(pathname, href)) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  );
}
