import { cn } from "@/lib/utils";

type AdSlotProps = {
  label: string;
  className?: string;
  size?: "banner" | "sidebar";
};

/** Placeholder for future monetization — styled to match the glass UI. */
export function AdSlot({ label, className, size = "banner" }: AdSlotProps) {
  return (
    <div
      aria-label="Advertisement placeholder"
      className={cn(
        "flex items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] text-xs uppercase tracking-widest text-zinc-600",
        size === "banner" && "min-h-[90px] w-full",
        size === "sidebar" && "min-h-[250px] w-full",
        className,
      )}
    >
      <span className="sr-only">Advertisement</span>
      {label}
    </div>
  );
}
