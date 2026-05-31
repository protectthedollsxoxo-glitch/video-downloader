import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolveExecutable } from "@/lib/binaries";
import type { YtdlpVideoInfo } from "@/lib/ytdlp/types";

const execFileAsync = promisify(execFile);

export function getYtdlpPath(): string {
  return resolveExecutable("yt-dlp");
}

/**
 * Strips query parameters from URLs to avoid shell escaping issues.
 */
function cleanUrl(url: string): string {
  return url.split("?")[0];
}

/**
 * Fetches video metadata and all available stream formats via yt-dlp JSON output.
 * Uses --no-download so we only query format codes needed for quality selection.
 */
export async function fetchVideoInfo(url: string): Promise<YtdlpVideoInfo> {
  const ytdlp = getYtdlpPath();
  const cleanedUrl = cleanUrl(url);

  const args = [
    "--dump-single-json",
    "--no-playlist",
    "--no-warnings",
    "--impersonate",
    "chrome",
    "--force-ipv4",
    "--socket-timeout",
    "60",
    "--retries",
    "3",
    "--fragment-retries",
    "3",
    cleanedUrl,
  ];

  console.log("[yt-dlp] Executing command:", ytdlp, args.join(" "));

  try {
    const { stdout } = await execFileAsync(ytdlp, args, {
      maxBuffer: 50 * 1024 * 1024,
      timeout: 90_000,
      windowsHide: true,
    });

    return JSON.parse(stdout) as YtdlpVideoInfo;
  } catch (error) {
    console.error("[yt-dlp] Command failed:", error);
    if (error instanceof Error && "stderr" in error) {
      console.error("[yt-dlp] stderr:", (error as any).stderr);
    }
    throw error;
  }
}

export function mapYtdlpError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Failed to analyze the video.";
  }

  const message = error.message.toLowerCase();

  if (message.includes("enoent") || message.includes("not found")) {
    return "yt-dlp is not installed. Install it and try again.";
  }

  if (message.includes("private")) {
    return "This video is private or unavailable.";
  }

  if (message.includes("confirm your age") || message.includes("sign in")) {
    return "This video requires sign-in or age verification. Try a different video that doesn't require login.";
  }

  if (message.includes("unsupported url") || message.includes("no video")) {
    return "No video found at this link.";
  }

  if (message.includes("timed out") || message.includes("timeout")) {
    return "The request timed out. Try again.";
  }

  return "Could not fetch video info. Check the link and try again.";
}
