import type { Platform } from "@/types/video";

export type UrlDetectionResult =
  | { ok: true; platform: Platform; normalizedUrl: string }
  | { ok: false; reason: string };

function detectPlatform(hostname: string): Platform | null {
  const host = hostname.toLowerCase();

  if (host.includes("youtube.com") || host.includes("youtu.be")) {
    return "youtube";
  }

  if (host.includes("tiktok.com")) {
    return "tiktok";
  }

  return null;
}

function isAllowedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, "");

  return (
    host === "youtu.be" ||
    host.endsWith("youtube.com") ||
    host.endsWith("tiktok.com")
  );
}

/** Detects whether a pasted URL is YouTube or TikTok and validates the hostname. */
export function detectVideoUrl(raw: string): UrlDetectionResult {
  const trimmed = raw.trim();

  if (!trimmed) {
    return { ok: false, reason: "Please paste a video link." };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, reason: "That doesn't look like a valid link." };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { ok: false, reason: "Only http and https links are supported." };
  }

  if (!isAllowedHost(parsed.hostname)) {
    return {
      ok: false,
      reason: "Only YouTube and TikTok links are supported.",
    };
  }

  const platform = detectPlatform(parsed.hostname);
  if (!platform) {
    return { ok: false, reason: "Could not detect the video platform." };
  }

  return {
    ok: true,
    platform,
    normalizedUrl: parsed.toString(),
  };
}
