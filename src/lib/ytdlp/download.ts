import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolveExecutable } from "@/lib/binaries";

const YTDLP_PROGRESS_RE = /\[download\]\s+(\d+(?:\.\d+)?)%/;

/**
 * Downloads a single yt-dlp format and reports progress from stderr.
 * Uses --newline so each progress update is on its own line.
 */
export function downloadFormat(
  url: string,
  formatId: string,
  outputTemplate: string,
  onYtdlpPercent?: (percent: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const ytdlp = resolveExecutable("yt-dlp");
    const args = [
      "-f",
      formatId,
      "--no-playlist",
      "--no-warnings",
      "--no-part",
      "--newline",
      "--progress",
      "--print",
      "after_move:filepath",
      "--user-agent",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "--referer",
      "https://www.tiktok.com/",
      "--no-check-certificate",
      "--extractor-args",
      "tiktok:api_host=api-tiktok.snssdk.com",
      "-o",
      outputTemplate,
      url,
    ];

    console.log("[yt-dlp] Executing download command:", ytdlp, args.join(" "));

    const proc = spawn(ytdlp, args, { windowsHide: true });
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    proc.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      stderr += text;

      if (onYtdlpPercent) {
        for (const line of text.split(/\r?\n/)) {
          const match = line.match(YTDLP_PROGRESS_RE);
          if (match) {
            onYtdlpPercent(parseFloat(match[1]));
          }
        }
      }
    });

    proc.on("error", (error) => {
      reject(error);
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(
            stderr.trim().slice(-500) || `yt-dlp exited with code ${code}`,
          ),
        );
        return;
      }

      const filepath = stdout
        .trim()
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .at(-1);

      if (!filepath || !existsSync(filepath)) {
        reject(new Error("Download failed — output file was not created."));
        return;
      }

      resolve(filepath);
    });
  });
}

export function mapDownloadError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Download failed.";
  }

  const message = error.message.toLowerCase();

  if (message.includes("enoent") || message.includes("not found")) {
    return "yt-dlp or ffmpeg is not installed.";
  }

  if (message.includes("ffmpeg")) {
    return "ffmpeg is required to merge video and audio. Install it and try again.";
  }

  if (message.includes("timeout") || message.includes("timed out")) {
    return "Download timed out. Try a lower quality.";
  }

  if (message.includes("private") || message.includes("unavailable")) {
    return "This video is unavailable.";
  }

  return "Download failed. Try again or pick a different quality.";
}
