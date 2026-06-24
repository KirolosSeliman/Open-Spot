import Image from "next/image";

import { cn } from "@/lib/utils/cn";

type OpenSpotLogoSize = "sm" | "md" | "lg";

type OpenSpotLogoProps = {
  className?: string;
  markClassName?: string;
  priority?: boolean;
  size?: OpenSpotLogoSize;
  textClassName?: string;
  variant?: "mark" | "lockup";
};

const markSizeClasses: Record<OpenSpotLogoSize, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12"
};

const imageSizes: Record<OpenSpotLogoSize, string> = {
  sm: "32px",
  md: "40px",
  lg: "48px"
};

export function OpenSpotLogo({
  className,
  markClassName,
  priority = false,
  size = "md",
  textClassName,
  variant = "mark"
}: OpenSpotLogoProps) {
  const mark = (
    <Image
      alt={variant === "mark" ? "Open Spot" : ""}
      aria-hidden={variant === "lockup" ? true : undefined}
      className={cn("block shrink-0 object-contain", markSizeClasses[size], markClassName)}
      height={256}
      priority={priority}
      sizes={imageSizes[size]}
      src="/brand/open-spot-logo-mark.png"
      width={256}
    />
  );

  if (variant === "mark") {
    return <span className={cn("inline-flex items-center", className)}>{mark}</span>;
  }

  return (
    <span className={cn("inline-flex items-center gap-2.5 leading-none", className)}>
      {mark}
      <span className={cn("open-spot-logo-wordmark font-black text-current", textClassName)}>
        Open Spot
      </span>
    </span>
  );
}
