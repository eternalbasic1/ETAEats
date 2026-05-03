interface BrandMarkProps {
  size?: "sm" | "md" | "lg";
  subtitle?: string;
  compact?: boolean;
}

export function BrandMark({
  size = "md",
  subtitle = "Food before you arrive",
  compact = false,
}: BrandMarkProps) {
  const shellSize =
    size === "sm" ? "h-10 w-10" : size === "lg" ? "h-14 w-14" : "h-12 w-12";
  const titleSize =
    size === "sm"
      ? "text-[15px]"
      : size === "lg"
        ? "text-[22px]"
        : "text-[18px]";

  return (
    <div className="flex items-center gap-3">
      <img
        src="/brand/logo.svg"
        alt="ETA Eats Logo"
        className={`${shellSize} object-contain`}
      />
      {!compact && (
        <div className="min-w-0">
          <p
            className={`${titleSize} font-semibold tracking-[-0.02em] text-text-primary leading-none`}
          >
            ETAEats
          </p>
          {subtitle && (
            <p className="mt-1.5 text-[11px] tracking-[0.06em] uppercase text-text-muted font-semibold">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
