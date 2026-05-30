import { Download } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  return (
    <header className="flex w-full items-center justify-between px-4 py-6 sm:px-8">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 ring-1 ring-white/10">
          <Download className="h-5 w-5 text-cyan-300" aria-hidden />
        </div>
        <div>
          <p className="text-lg font-semibold text-foreground">ClipFetch</p>
          <p className="text-xs text-muted-foreground">YouTube & TikTok</p>
        </div>
      </div>
      <ThemeToggle />
    </header>
  );
}
