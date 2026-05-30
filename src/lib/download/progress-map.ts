import type { DownloadProgressUpdate, DownloadStage } from "@/types/download";

const STAGE_MESSAGES: Record<DownloadStage, string> = {
  preparing: "Preparing download…",
  video: "Downloading video…",
  audio: "Downloading audio…",
  merging: "Merging video and audio…",
  finalizing: "Finalizing file…",
};

export function stageMessage(stage: DownloadStage): string {
  return STAGE_MESSAGES[stage];
}

/** Maps yt-dlp 0–100% into an overall progress range for the current step. */
export function mapYtdlpPercent(
  stage: "video" | "audio",
  ytdlpPercent: number,
  needsMerge: boolean,
): number {
  const clamped = Math.min(100, Math.max(0, ytdlpPercent));

  if (stage === "video") {
    const [start, end] = needsMerge ? [5, 45] : [5, 88];
    return Math.round(start + (clamped / 100) * (end - start));
  }

  const [start, end] = [48, 72];
  return Math.round(start + (clamped / 100) * (end - start));
}

export function fixedProgress(
  stage: DownloadStage,
  percent: number,
): DownloadProgressUpdate {
  return {
    stage,
    percent,
    message: stageMessage(stage),
  };
}
