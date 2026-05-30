import { randomUUID } from "node:crypto";
import {
  checkBinaries,
  isFfmpegReady,
  isYtdlpReady,
} from "@/lib/binaries";
import { prepareDownload } from "@/lib/download/service";
import { storeDownloadJob } from "@/lib/download/jobs";
import { detectVideoUrl } from "@/lib/utils/url-detector";
import type { DownloadSseEvent } from "@/types/download";
import type { AnalyzeErrorResponse, DownloadRequest, QualityId } from "@/types/video";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const VALID_QUALITIES = new Set<QualityId>(["480p", "720p", "1080p", "4K"]);

function parseDownloadBody(body: unknown): DownloadRequest | null {
  if (!body || typeof body !== "object") return null;

  const record = body as Record<string, unknown>;
  const url = typeof record.url === "string" ? record.url.trim() : "";
  const qualityId = record.qualityId as QualityId;
  const formatId =
    typeof record.formatId === "string" ? record.formatId.trim() : "";
  const audioFormatId =
    typeof record.audioFormatId === "string"
      ? record.audioFormatId.trim()
      : undefined;
  const needsMerge = record.needsMerge === true;
  const title =
    typeof record.title === "string" ? record.title.trim() : undefined;

  if (!url || !formatId || !VALID_QUALITIES.has(qualityId)) {
    return null;
  }

  return {
    url,
    qualityId,
    formatId,
    audioFormatId,
    needsMerge,
    title,
  };
}

function sseEncode(event: DownloadSseEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json<AnalyzeErrorResponse>(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const params = parseDownloadBody(body);
  if (!params) {
    return NextResponse.json<AnalyzeErrorResponse>(
      { error: "Missing or invalid download parameters." },
      { status: 400 },
    );
  }

  const detection = detectVideoUrl(params.url);
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
      { error: "Video download is currently unavailable. Please install yt-dlp to enable this feature." },
      { status: 503 },
    );
  }

  if (params.needsMerge && !isFfmpegReady(binaries)) {
    console.warn("[API] ffmpeg not available for merge, returning graceful error");
    return NextResponse.json<AnalyzeErrorResponse>(
      {
        error: "High-quality downloads require ffmpeg. Please install ffmpeg to enable this feature.",
      },
      { status: 503 },
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: DownloadSseEvent) => {
        controller.enqueue(sseEncode(event));
      };

      try {
        const jobId = randomUUID();

        const result = await prepareDownload(
          { ...params, url: detection.normalizedUrl },
          (progress) => send({ type: "progress", ...progress }),
        );

        storeDownloadJob(jobId, result);

        send({
          type: "complete",
          jobId,
          filename: result.filename,
          percent: 100,
        });
        controller.close();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Download failed.";
        send({ type: "error", error: message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
