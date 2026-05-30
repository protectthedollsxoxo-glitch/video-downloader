export function AdSlot({ position }: { position: "left" | "right" }) {
  return (
    <aside
      className={`hidden lg:block fixed top-0 bottom-0 w-48 ${
        position === "left" ? "left-0" : "right-0"
      } pointer-events-none`}
      aria-hidden
    >
      <div className="sticky top-24 mx-4 h-[600px] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
        <p className="text-center text-xs text-muted-foreground">Advertisement</p>
      </div>
    </aside>
  );
}
