import { checkBinaries, isSystemReady } from "@/lib/binaries";
import { NextResponse } from "next/server";

export async function GET() {
  const binaries = await checkBinaries();
  const ready = isSystemReady(binaries);

  return NextResponse.json(
    {
      status: ready ? "ok" : "degraded",
      message: ready
        ? "All media tools are available."
        : "Install yt-dlp and ffmpeg to enable downloads.",
      binaries,
      timestamp: new Date().toISOString(),
    },
    { status: ready ? 200 : 503 },
  );
}
