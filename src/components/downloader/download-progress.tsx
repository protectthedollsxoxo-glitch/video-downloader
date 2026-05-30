"use client";

import { cn } from "@/lib/utils";
import type { DownloadProgressUpdate } from "@/types/download";
import { motion } from "framer-motion";

type DownloadProgressBarProps = {
  progress: DownloadProgressUpdate;
};

export function DownloadProgressBar({ progress }: DownloadProgressBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="space-y-2"
      role="status"
      aria-live="polite"
      aria-valuenow={progress.percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-300">{progress.message}</span>
        <span className="font-medium tabular-nums text-cyan-300">
          {progress.percent}%
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className={cn(
            "h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500",
          )}
          initial={{ width: 0 }}
          animate={{ width: `${progress.percent}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
    </motion.div>
  );
}
