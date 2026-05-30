import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import {
  getDownloadJob,
  removeDownloadJob,
} from "@/lib/download/jobs";
import { buildContentDisposition } from "@/lib/utils/filename";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const jobId = new URL(request.url).searchParams.get("jobId")?.trim();

  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId." }, { status: 400 });
  }

  const job = getDownloadJob(jobId);
  if (!job) {
    return NextResponse.json(
      { error: "Download expired or not found. Try again." },
      { status: 404 },
    );
  }

  try {
    const fileStat = await stat(job.filePath);
    const nodeStream = createReadStream(job.filePath);

    const cleanup = () => {
      void removeDownloadJob(jobId);
    };

    nodeStream.on("close", cleanup);
    nodeStream.on("error", cleanup);

    const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

    return new Response(webStream, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": buildContentDisposition(job.filename),
        "Content-Length": String(fileStat.size),
      },
    });
  } catch {
    await removeDownloadJob(jobId);
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
}
