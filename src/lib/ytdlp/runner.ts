import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolveExecutable } from "@/lib/binaries";
import type { YtdlpVideoInfo } from "@/lib/ytdlp/types";

const execFileAsync = promisify(execFile);

export function getYtdlpPath(): string {
  return resolveExecutable("yt-dlp");
}

/**
 * Fetches video metadata and all available stream formats via yt-dlp JSON output.
 * Uses --no-download so we only query format codes needed for quality selection.
 */
export async function fetchVideoInfo(url: string): Promise<YtdlpVideoInfo> {
  const ytdlp = getYtdlpPath();

  const args = [
    "--dump-single-json",
    "--no-playlist",
    "--no-warnings",
    "--user-agent",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "--referer",
    "https://www.tiktok.com/",
    "--no-check-certificate",
    "--extractor-args",
    "tiktok:api_host=api-tiktok.snssdk.com",
    url,
  ];

  console.log("[yt-dlp] Executing command:", ytdlp, args.join(" "));

  const { stdout } = await execFileAsync(ytdlp, args, {
    maxBuffer: 50 * 1024 * 1024,
    timeout: 90_000,
    windowsHide: true,
  });

  return JSON.parse(stdout) as YtdlpVideoInfo;
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
