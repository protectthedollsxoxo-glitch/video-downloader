import type { QualityId } from "@/types/video";

/** Builds a safe attachment filename from the video title and quality. */
export function buildDownloadFilename(
  title: string | undefined,
  qualityId: QualityId,
): string {
  const base =
    (title ?? "video")
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80) || "video";

  return `${base}-${qualityId}.mp4`;
}

export function buildContentDisposition(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7E]/g, "_");
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}
