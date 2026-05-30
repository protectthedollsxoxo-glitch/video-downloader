import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export async function createTempDir(): Promise<string> {
  const base = process.env.TEMP_DIR?.trim() || os.tmpdir();
  return mkdtemp(path.join(base, "clipfetch-"));
}

export async function cleanupTempDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}
