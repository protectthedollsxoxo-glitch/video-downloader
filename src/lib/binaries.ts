import { execFile, execSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type BinaryStatus = {
  name: "yt-dlp" | "ffmpeg";
  available: boolean;
  path: string;
  version?: string;
  error?: string;
};

function resolveBinaryPath(envKey: string, fallback: string): string {
  return process.env[envKey]?.trim() || fallback;
}

/** PowerShell sees WinGet shims that Node's short PATH often misses. */
function findViaPowerShell(exeName: string): string | undefined {
  if (process.platform !== "win32") return undefined;

  try {
    const output = execSync(
      `powershell -NoProfile -Command "(Get-Command '${exeName}' -ErrorAction SilentlyContinue).Source"`,
      { encoding: "utf8", windowsHide: true, timeout: 10_000 },
    ).trim();

    if (output && existsSync(output)) return output;
  } catch {
    // Fall through.
  }

  return undefined;
}

/** Uses Windows `where.exe` because Node often inherits a shorter PATH than the user shell. */
function findOnWindows(exeName: string): string | undefined {
  if (process.platform !== "win32") return undefined;

  try {
    const output = execSync(`where.exe ${exeName}`, {
      encoding: "utf8",
      windowsHide: true,
      timeout: 5_000,
    }).trim();

    const first = output.split(/\r?\n/).find(Boolean)?.trim();
    if (first && existsSync(first)) return first;
  } catch {
    // Fall through.
  }

  return findViaPowerShell(exeName.replace(/\.exe$/i, ""));
}

/** WinGet often installs into Packages\ without adding a Links shim Node can see. */
function findInWinGetPackages(exeFileName: string): string | undefined {
  const packagesDir = path.join(
    process.env.LOCALAPPDATA ?? "",
    "Microsoft",
    "WinGet",
    "Packages",
  );

  if (!existsSync(packagesDir)) return undefined;

  const target = exeFileName.toLowerCase();

  function walk(dir: string, depth: number): string | undefined {
    if (depth > 6) return undefined;

    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return undefined;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isFile() && entry.name.toLowerCase() === target) {
        return fullPath;
      }

      if (entry.isDirectory()) {
        const found = walk(fullPath, depth + 1);
        if (found) return found;
      }
    }

    return undefined;
  }

  return walk(packagesDir, 0);
}

export function resolveExecutable(name: "yt-dlp" | "ffmpeg"): string {
  const envKey = name === "yt-dlp" ? "YTDLP_PATH" : "FFMPEG_PATH";
  const fromEnv = process.env[envKey]?.trim();
  if (fromEnv && existsSync(fromEnv)) return fromEnv;

  // Linux/Railway: use system PATH
  if (process.platform !== "win32") {
    return name;
  }

  const winName = name === "yt-dlp" ? "yt-dlp.exe" : "ffmpeg.exe";

  const fromWhere = findOnWindows(winName);
  if (fromWhere) return fromWhere;

  const localAppData = process.env.LOCALAPPDATA ?? "";
  const programFiles = process.env.ProgramFiles ?? "C:\\Program Files";

  const staticCandidates = [
    path.join(localAppData, "Microsoft", "WinGet", "Links", winName),
    path.join(programFiles, "ffmpeg", "bin", winName),
  ];

  const fromStatic = staticCandidates.find((candidate) =>
    existsSync(candidate),
  );
  if (fromStatic) return fromStatic;

  const fromPackages = findInWinGetPackages(winName);
  if (fromPackages) return fromPackages;

  return resolveBinaryPath(envKey, name);
}

async function getVersion(
  command: string,
  args: string[],
): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync(command, args, {
      timeout: 30_000,
      windowsHide: false,
    });
    return stdout.trim().split("\n")[0];
  } catch {
    return undefined;
  }
}

/** Checks whether yt-dlp and ffmpeg are installed and reachable. */
export async function checkBinaries(): Promise<BinaryStatus[]> {
  const checks: Array<{
    name: BinaryStatus["name"];
    versionArgs: string[];
  }> = [
    { name: "yt-dlp", versionArgs: ["--version"] },
    { name: "ffmpeg", versionArgs: ["-version"] },
  ];

  return Promise.all(
    checks.map(async ({ name, versionArgs }) => {
      const resolvedPath = resolveExecutable(name);

      try {
        const version = await getVersion(resolvedPath, versionArgs);
        return {
          name,
          available: Boolean(version),
          path: resolvedPath,
          version,
        } satisfies BinaryStatus;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        // Log warning instead of throwing during development
        console.warn(`[Binary Check] ${name} not available: ${message}`);
        return {
          name,
          available: false,
          path: resolvedPath,
          error: message,
        } satisfies BinaryStatus;
      }
    }),
  );
}

export function isSystemReady(binaries: BinaryStatus[]): boolean {
  return binaries.every((binary) => binary.available);
}

/** Analyze only needs yt-dlp. ffmpeg is required for downloads (Phase 3). */
export function isYtdlpReady(binaries: BinaryStatus[]): boolean {
  return binaries.some((binary) => binary.name === "yt-dlp" && binary.available);
}

export function isFfmpegReady(binaries: BinaryStatus[]): boolean {
  return binaries.some((binary) => binary.name === "ffmpeg" && binary.available);
}
