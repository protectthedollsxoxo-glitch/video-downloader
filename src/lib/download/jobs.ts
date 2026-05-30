import { cleanupTempDir } from "@/lib/temp";
import type { DownloadResult } from "@/lib/download/service";

type StoredJob = DownloadResult & { createdAt: number };

const jobs = new Map<string, StoredJob>();
const JOB_TTL_MS = 15 * 60 * 1000;

export function storeDownloadJob(jobId: string, result: DownloadResult): void {
  jobs.set(jobId, { ...result, createdAt: Date.now() });
}

export function getDownloadJob(jobId: string): StoredJob | undefined {
  const job = jobs.get(jobId);
  if (!job) return undefined;

  if (Date.now() - job.createdAt > JOB_TTL_MS) {
    void removeDownloadJob(jobId);
    return undefined;
  }

  return job;
}

export async function removeDownloadJob(jobId: string): Promise<void> {
  const job = jobs.get(jobId);
  if (job) {
    await cleanupTempDir(job.tempDir);
  }
  jobs.delete(jobId);
}
