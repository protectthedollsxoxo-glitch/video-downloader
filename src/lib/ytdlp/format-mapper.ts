import type { YtdlpFormat } from "@/lib/ytdlp/types";
import type { Platform, QualityId, QualityOption } from "@/types/video";

const QUALITY_TIERS: Array<{ id: QualityId; height: number; label: string }> = [
  { id: "480p", height: 480, label: "480p (Standard)" },
  { id: "720p", height: 720, label: "720p (HD)" },
  { id: "1080p", height: 1080, label: "1080p (Full HD)" },
  { id: "4K", height: 2160, label: "4K (Ultra HD)" },
];

function hasVideo(format: YtdlpFormat): boolean {
  return Boolean(format.vcodec && format.vcodec !== "none");
}

function hasAudio(format: YtdlpFormat): boolean {
  return Boolean(format.acodec && format.acodec !== "none");
}

function isCombined(format: YtdlpFormat): boolean {
  return hasVideo(format) && hasAudio(format);
}

function isVideoOnly(format: YtdlpFormat): boolean {
  return hasVideo(format) && !hasAudio(format);
}

function isAudioOnly(format: YtdlpFormat): boolean {
  return hasAudio(format) && !hasVideo(format);
}

function formatScore(format: YtdlpFormat): number {
  let score = 0;
  const vcodec = format.vcodec ?? "";
  const ext = format.ext ?? "";

  if (vcodec.includes("avc1") || vcodec.includes("h264")) score += 100;
  if (ext === "mp4") score += 50;
  score += format.tbr ?? format.abr ?? 0;

  if (format.protocol && !format.protocol.includes("m3u8")) {
    score += 20;
  }

  return score;
}

function pickBest(formats: YtdlpFormat[]): YtdlpFormat | undefined {
  return [...formats].sort((a, b) => formatScore(b) - formatScore(a))[0];
}

function estimateSize(format: YtdlpFormat): number | undefined {
  return format.filesize ?? format.filesize_approx;
}

/**
 * Maps yt-dlp format entries to our 480p / 720p / 1080p / 4K buckets.
 *
 * YouTube often returns separate DASH streams (video-only + audio-only).
 * We flag those with needsMerge so Phase 3 can combine them with ffmpeg.
 */
export function mapFormatsToQualities(
  formats: YtdlpFormat[] | undefined,
  platform: Platform,
): QualityOption[] {
  if (!formats?.length) return [];

  const usable = formats.filter(
    (format) =>
      format.format_id &&
      format.height &&
      format.height > 0 &&
      (hasVideo(format) || isAudioOnly(format) === false),
  );

  const videoFormats = usable.filter(hasVideo);
  const audioFormats = usable.filter(isAudioOnly);
  const bestAudio = pickBest(audioFormats);

  const qualities: QualityOption[] = [];

  for (const tier of QUALITY_TIERS) {
    const atHeight = videoFormats.filter((format) => format.height === tier.height);

    // TikTok / some CDNs use nearby heights — allow a small tolerance on TikTok.
    const candidates =
      atHeight.length > 0
        ? atHeight
        : platform === "tiktok"
          ? videoFormats.filter(
              (format) =>
                format.height !== undefined &&
                Math.abs(format.height - tier.height) <= 32,
            )
          : [];

    if (!candidates.length) continue;

    const combined = pickBest(candidates.filter(isCombined));
    if (combined) {
      qualities.push({
        id: tier.id,
        label: tier.label,
        height: combined.height ?? tier.height,
        formatId: combined.format_id,
        hasAudio: true,
        needsMerge: false,
        filesizeEstimate: estimateSize(combined),
        ext: combined.ext ?? "mp4",
      });
      continue;
    }

    const videoOnly = pickBest(candidates.filter(isVideoOnly));
    if (videoOnly && bestAudio) {
      qualities.push({
        id: tier.id,
        label: tier.label,
        height: videoOnly.height ?? tier.height,
        formatId: videoOnly.format_id,
        audioFormatId: bestAudio.format_id,
        hasAudio: true,
        needsMerge: true,
        filesizeEstimate:
          (estimateSize(videoOnly) ?? 0) + (estimateSize(bestAudio) ?? 0) || undefined,
        ext: "mp4",
      });
      continue;
    }

    const fallback = pickBest(candidates);
    if (fallback) {
      qualities.push({
        id: tier.id,
        label: tier.label,
        height: fallback.height ?? tier.height,
        formatId: fallback.format_id,
        hasAudio: hasAudio(fallback),
        needsMerge: false,
        filesizeEstimate: estimateSize(fallback),
        ext: fallback.ext ?? "mp4",
      });
    }
  }

  return qualities;
}
