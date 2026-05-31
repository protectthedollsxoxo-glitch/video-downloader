import { checkBinaries, isYtdlpReady } from "@/lib/binaries";
import { analyzeVideo } from "@/lib/ytdlp/analyze";
import { detectVideoUrl } from "@/lib/utils/url-detector";
import type { AnalyzeErrorResponse, AnalyzeResponse } from "@/types/video";
import { NextResponse } from "next/server";

export const maxDuration = 120;

export async function POST(request: Request) {
  let body: { url?: string };

  try {
    body = (await request.json()) as { url?: string };
  } catch {
    return NextResponse.json<AnalyzeErrorResponse>(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const rawUrl = body.url?.trim();
  if (!rawUrl) {
    return NextResponse.json<AnalyzeErrorResponse>(
      { error: "Please provide a video URL." },
      { status: 400 },
    );
  }

  const detection = detectVideoUrl(rawUrl);
  if (!detection.ok) {
    return NextResponse.json<AnalyzeErrorResponse>(
      { error: detection.reason },
      { status: 400 },
    );
  }

  const binaries = await checkBinaries();
  if (!isYtdlpReady(binaries)) {
    console.warn("[API] yt-dlp not available, returning graceful error");
    return NextResponse.json<AnalyzeErrorResponse>(
      {
        error: "Video analysis is currently unavailable. Please install yt-dlp to enable this feature.",
      },
      { status: 503 },
    );
  }

  try {
    const result: AnalyzeResponse = await analyzeVideo(
      detection.normalizedUrl,
      detection.platform,
    );
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to analyze video.";
    return NextResponse.json<AnalyzeErrorResponse>(
      { error: message },
      { status: 502 },
    );
  }
}
