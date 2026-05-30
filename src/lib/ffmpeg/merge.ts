import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolveExecutable } from "@/lib/binaries";

const execFileAsync = promisify(execFile);

/**
 * Merges separate DASH video and audio into one MP4 without re-encoding.
 * YouTube often serves these as two streams — ffmpeg copies both into a single file.
 */
export async function mergeVideoAudio(
  videoPath: string,
  audioPath: string,
  outputPath: string,
): Promise<void> {
  const ffmpeg = resolveExecutable("ffmpeg");

  await execFileAsync(
    ffmpeg,
    [
      "-y",
      "-i",
      videoPath,
      "-i",
      audioPath,
      "-c",
      "copy",
      "-movflags",
      "+faststart",
      outputPath,
    ],
    {
      timeout: 600_000,
      windowsHide: true,
    },
  );
}
