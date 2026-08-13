import Image from "next/image";
import { BRAND_ASSETS } from "@/lib/brand";

export function BrandMark({
  className = "h-8 w-8",
  size = 32,
  priority = false,
}: {
  className?: string;
  size?: number;
  priority?: boolean;
}) {
  return (
    <Image
      src={BRAND_ASSETS.symbol}
      alt=""
      width={size}
      height={size}
      className={`brand-sigil ${className}`.trim()}
      aria-hidden="true"
      priority={priority}
    />
  );
}

export function BrandLockup({
  className = "",
}: {
  className?: string;
}) {
  return (
    <Image
      src={BRAND_ASSETS.lockup}
      alt="PlotRipple"
      width={200}
      height={50}
      className={`h-10 w-auto max-w-[11rem] sm:max-w-[13rem] ${className}`.trim()}
    />
  );
}
