interface BrandMarkProps {
  size?: "sm" | "md" | "lg";
  subtitle?: string;
}

export function BrandMark({
  size = "md",
  subtitle = "Food before you arrive",
}: BrandMarkProps) {
  const shellSize =
    size === "sm" ? "h-11 w-11" : size === "lg" ? "h-16 w-16" : "h-13 w-13";
  const titleSize =
    size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-xl";

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${shellSize} rounded-2xl border border-border bg-accent-powder-blue flex items-center justify-center shadow-e1`}
      >
        <img
          src="/brand/Gemini_Generated_Image_yfra66yfra66yfra.png"
          alt="ETAEats logo"
          className="h-[72%] w-[72%] object-contain"
        />
      </div>
      <div>
        <p
          className={`${titleSize} font-semibold tracking-tight text-text-primary`}
        >
          ETAEats
        </p>
        <p className="text-xs text-text-secondary">{subtitle}</p>
      </div>
    </div>
  );
}
