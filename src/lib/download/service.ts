import path from "node:path";
import { mergeVideoAudio } from "@/lib/ffmpeg/merge";
import {
  fixedProgress,
  mapYtdlpPercent,
} from "@/lib/download/progress-map";
import { createTempDir, cleanupTempDir } from "@/lib/temp";
import { buildDownloadFilename } from "@/lib/utils/filename";
import { downloadFormat, mapDownloadError } from "@/lib/ytdlp/download";
import type { DownloadProgressUpdate } from "@/types/download";
import type { QualityId } from "@/types/video";

export type DownloadParams = {
  url: string;
  qualityId: QualityId;
  formatId: string;
  audioFormatId?: string;
  needsMerge: boolean;
  title?: string;
};

export type DownloadResult = {
  filePath: string;
  filename: string;
  tempDir: string;
};

/**
 * Downloads the selected quality and returns a single MP4 path.
 * Reports progress for video download, audio download, and ffmpeg merge.
 */
export async function prepareDownload(
  params: DownloadParams,
  onProgress?: (update: DownloadProgressUpdate) => void,
): Promise<DownloadResult> {
  const report = (update: DownloadProgressUpdate) => onProgress?.(update);

  const tempDir = await createTempDir();
  const filename = buildDownloadFilename(params.title, params.qualityId);

  try {
    report(fixedProgress("preparing", 2));

    if (params.needsMerge) {
      if (!params.audioFormatId) {
        throw new Error("Missing audio stream for DASH merge.");
      }

      report(fixedProgress("video", 5));

      const videoPath = await downloadFormat(
        params.url,
        params.formatId,
        path.join(tempDir, "video.%(ext)s"),
        (ytdlpPercent) => {
          report({
            stage: "video",
            percent: mapYtdlpPercent("video", ytdlpPercent, true),
            message: "Downloading video…",
          });
        },
      );

      report(fixedProgress("audio", 48));

      const audioPath = await downloadFormat(
        params.url,
        params.audioFormatId,
        path.join(tempDir, "audio.%(ext)s"),
        (ytdlpPercent) => {
          report({
            stage: "audio",
            percent: mapYtdlpPercent("audio", ytdlpPercent, true),
            message: "Downloading audio…",
          });
        },
      );

      report(fixedProgress("merging", 75));

      const outputPath = path.join(tempDir, "output.mp4");
      await mergeVideoAudio(videoPath, audioPath, outputPath);

      report(fixedProgress("finalizing", 96));

      return { filePath: outputPath, filename, tempDir };
    }

    report(fixedProgress("video", 5));

    const downloaded = await downloadFormat(
      params.url,
      params.formatId,
      path.join(tempDir, "output.%(ext)s"),
      (ytdlpPercent) => {
        report({
          stage: "video",
          percent: mapYtdlpPercent("video", ytdlpPercent, false),
          message: "Downloading video…",
        });
      },
    );

    report(fixedProgress("finalizing", 96));

    return { filePath: downloaded, filename, tempDir };
  } catch (error) {
    await cleanupTempDir(tempDir);
    throw new Error(mapDownloadError(error));
  }
}
