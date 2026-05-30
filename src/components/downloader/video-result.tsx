"use client";

import { DownloadProgressBar } from "@/components/downloader/download-progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DownloadProgressUpdate } from "@/types/download";
import type { AnalyzeResponse, QualityId, QualityOption } from "@/types/video";
import { motion } from "framer-motion";
import { Clock, HardDrive, Loader2, User } from "lucide-react";
import Image from "next/image";

type VideoResultProps = {
  data: AnalyzeResponse;
};

function formatDuration(seconds?: number): string | null {
  if (!seconds) return null;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function formatFileSize(bytes?: number): string | null {
  if (!bytes) return null;
  const mb = bytes / (1024 * 1024);
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${Math.round(mb)} MB`;
}

export function VideoResult({ data }: VideoResultProps) {
  const duration = formatDuration(data.duration);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-2xl"
    >
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row">
          {data.thumbnail ? (
            <div className="relative mx-auto aspect-video w-full shrink-0 overflow-hidden rounded-2xl bg-black/40 sm:mx-0 sm:w-44">
              <Image
                src={data.thumbnail}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 176px"
                unoptimized
              />
            </div>
          ) : null}

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>
                {data.platform === "youtube" ? "YouTube" : "TikTok"}
              </Badge>
              {duration ? (
                <Badge variant="muted" className="gap-1">
                  <Clock className="h-3 w-3" aria-hidden />
                  {duration}
                </Badge>
              ) : null}
            </div>

            <h2 className="line-clamp-2 text-lg font-semibold text-white">
              {data.title}
            </h2>

            {data.author ? (
              <p className="flex items-center gap-2 text-sm text-zinc-400">
                <User className="h-4 w-4 shrink-0" aria-hidden />
                {data.author}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

type QualitySelectorProps = {
  qualities: QualityOption[];
  selectedId: QualityId | null;
  onSelect: (id: QualityId) => void;
  onDownload: () => void;
  downloading?: boolean;
  downloadProgress?: DownloadProgressUpdate | null;
};

const QUALITY_ORDER: QualityId[] = ["480p", "720p", "1080p", "4K"];

export function QualitySelector({
  qualities,
  selectedId,
  onSelect,
  onDownload,
  downloading = false,
  downloadProgress = null,
}: QualitySelectorProps) {
  const sortedQualities = [...qualities].sort(
    (a, b) => QUALITY_ORDER.indexOf(a.id) - QUALITY_ORDER.indexOf(b.id),
  );
  const selected = qualities.find((q) => q.id === selectedId);
  const onlyOne = sortedQualities.length === 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="download-actions w-full max-w-2xl"
    >
      <Card>
        <CardContent className="space-y-5 pt-6">
          <div>
            <h3 className="text-base font-semibold text-white">
              {onlyOne ? "Available quality" : "Choose quality"}
            </h3>
            <p className="mt-1 text-sm text-zinc-400">
              {onlyOne
                ? "This video only has one download option."
                : "Pick the resolution you want."}
            </p>
          </div>

          <div
            className={cn(
              "grid gap-3",
              onlyOne && "grid-cols-1",
              sortedQualities.length === 2 && "grid-cols-2",
              sortedQualities.length === 3 && "grid-cols-3",
              sortedQualities.length >= 4 && "grid-cols-2 sm:grid-cols-4",
            )}
          >
            {sortedQualities.map((quality) => {
              const isSelected = selectedId === quality.id;

              return (
                <button
                  key={quality.id}
                  type="button"
                  onClick={() => onSelect(quality.id)}
                  className={cn(
                    "interactive-touch flex h-14 min-h-[48px] items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-zinc-100 transition-all",
                    "hover:border-cyan-400/40 hover:bg-cyan-400/10",
                    "active:border-cyan-400/50 active:bg-cyan-400/20",
                    isSelected &&
                      "border-cyan-400/60 bg-cyan-400/15 text-cyan-100 ring-2 ring-cyan-400/30",
                  )}
                >
                  {quality.id}
                </button>
              );
            })}
          </div>

          {selected ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-black/20 px-4 py-3 text-xs text-zinc-400">
              {selected.needsMerge ? (
                <Badge variant="warning">DASH merge required</Badge>
              ) : (
                <Badge variant="success">Ready to download</Badge>
              )}
              {formatFileSize(selected.filesizeEstimate) ? (
                <span className="flex items-center gap-1">
                  <HardDrive className="h-3.5 w-3.5" aria-hidden />~
                  {formatFileSize(selected.filesizeEstimate)}
                </span>
              ) : null}
            </div>
          ) : null}

          {downloading && downloadProgress ? (
            <DownloadProgressBar progress={downloadProgress} />
          ) : null}

          <button
            type="button"
            disabled={!selectedId || downloading}
            onClick={onDownload}
            className={cn(
              "interactive-touch flex h-14 min-h-[48px] w-full items-center justify-center gap-2 rounded-xl text-base font-medium transition-all",
              selectedId && !downloading
                ? "bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 active:brightness-95 active:shadow-cyan-500/30"
                : "cursor-not-allowed bg-white/5 text-zinc-500",
              selectedId &&
                downloading &&
                "bg-gradient-to-r from-cyan-500/80 to-violet-500/80 text-white",
            )}
          >
            {downloading ? (
              downloadProgress ? (
                <span>{downloadProgress.percent}%</span>
              ) : (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  Downloading…
                </>
              )
            ) : (
              "Download video"
            )}
          </button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
