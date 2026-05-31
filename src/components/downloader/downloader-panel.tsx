"use client";

import { Button } from "@/components/ui/button";
import { QualitySelector, VideoResult } from "@/components/downloader/video-result";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { detectVideoUrl } from "@/lib/utils/url-detector";
import { consumeDownloadStream } from "@/lib/download/parse-sse";
import type { DownloadProgressUpdate } from "@/types/download";
import type { AnalyzeResponse, QualityId } from "@/types/video";
import { motion } from "framer-motion";
import { AlertCircle, Link2, Loader2, Sparkles } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

function parseFilename(header: string | null): string | null {
  if (!header) return null;

  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const asciiMatch = header.match(/filename="([^"]+)"/i);
  return asciiMatch?.[1] ?? null;
}

export function DownloaderPanel() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] =
    useState<DownloadProgressUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<QualityId | null>(null);

  const detection = useMemo(() => detectVideoUrl(url), [url]);

  const handleAnalyze = useCallback(async () => {
    setError(null);
    setResult(null);
    setSelectedQuality(null);

    if (!detection.ok) {
      setError(detection.reason);
      return;
    }

    setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = (await response.json()) as AnalyzeResponse & {
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      setResult(data);
      if (data.qualities.length === 1) {
        setSelectedQuality(data.qualities[0].id);
      }
    } catch {
      setError("Network error. Is the dev server running?");
    } finally {
      setLoading(false);
    }
  }, [detection, url]);

  const handleDownload = useCallback(async () => {
    if (!result || !selectedQuality) return;

    const quality = result.qualities.find((q) => q.id === selectedQuality);
    if (!quality) return;

    setError(null);
    setDownloading(true);
    setDownloadProgress({
      percent: 0,
      stage: "preparing",
      message: "Preparing download…",
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: result.url,
          qualityId: quality.id,
          formatId: quality.formatId,
          audioFormatId: quality.audioFormatId,
          needsMerge: quality.needsMerge,
          title: result.title,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get("content-type") ?? "";

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(data.error ?? "Download failed.");
        return;
      }

      if (!contentType.includes("text/event-stream")) {
        setError("Unexpected server response.");
        return;
      }

      let completed: { jobId: string; filename: string } | null = null as { jobId: string; filename: string } | null;

      await consumeDownloadStream(response, (event) => {
        if (event.type === "progress") {
          setDownloadProgress({
            percent: event.percent,
            stage: event.stage,
            message: event.message,
          });
        }
        if (event.type === "complete") {
          completed = { jobId: event.jobId, filename: event.filename };
          setDownloadProgress({
            percent: 100,
            stage: "finalizing",
            message: "Saving to your device…",
          });
        }
        if (event.type === "error") {
          throw new Error(event.error);
        }
      });

      if (!completed) {
        setError("Download did not complete.");
        return;
      }

      const fileResponse = await fetch(
        `/api/download/file?jobId=${encodeURIComponent(completed.jobId)}`,
      );

      if (!fileResponse.ok) {
        const data = (await fileResponse.json()) as { error?: string };
        setError(data.error ?? "Could not retrieve the file.");
        return;
      }

      const blob = await fileResponse.blob();
      const filename =
        parseFilename(fileResponse.headers.get("Content-Disposition")) ??
        completed.filename;

      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Download failed. Check your connection and try again.";
      setError(message);
    } finally {
      setDownloading(false);
      setDownloadProgress(null);
    }
  }, [result, selectedQuality]);

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
        aria-labelledby="hero-heading"
      >
        <div className="mb-10 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-5 py-2 text-sm font-medium text-cyan-200 dark:text-cyan-200 text-foreground"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            Download videos in HD
          </motion.div>
          <h1
            id="hero-heading"
            className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl"
          >
            Paste your link.
            <br className="hidden sm:block" />
            Download instantly.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl">
            YouTube and TikTok videos in HD and beyond.
          </p>
        </div>

        <Card className="border border-white/10 bg-white/5 backdrop-blur-xl dark:bg-white/5 bg-secondary/50 dark:border-white/10 border-border">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="relative">
              <Input
                type="url"
                inputMode="url"
                autoComplete="off"
                placeholder="Paste your YouTube or TikTok link here"
                value={url}
                onChange={(event) => {
                  setUrl(event.target.value);
                  setError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && url.trim() && !loading) {
                    void handleAnalyze();
                  }
                }}
                aria-label="Video URL"
                aria-invalid={Boolean(error)}
                className="h-14 border-white/10 bg-white/5 text-lg placeholder:text-muted-foreground dark:bg-white/5 dark:border-white/10 bg-background border-border"
              />
              <Link2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            </div>

            {detection.ok ? (
              <div className="flex justify-center">
                <Badge className="border-cyan-400/20 bg-cyan-400/10 text-cyan-200 dark:text-cyan-200 text-foreground">
                  Detected: {detection.platform === "youtube" ? "YouTube" : "TikTok"}
                </Badge>
              </div>
            ) : null}

            {error ? (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {error}
              </div>
            ) : null}

            <Button
              type="button"
              size="lg"
              className="h-14 w-full bg-gradient-to-r from-cyan-500 to-violet-500 text-lg font-semibold hover:from-cyan-600 hover:to-violet-600"
              disabled={!url.trim() || loading || downloading}
              onClick={() => void handleAnalyze()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  Analyzing…
                </>
              ) : (
                "Download Video"
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Supports YouTube, TikTok, and Shorts
            </p>
          </CardContent>
        </Card>
      </motion.section>

      {result ? (
        <div className="flex w-full max-w-2xl flex-col items-center gap-8">
          <VideoResult data={result} />
          <QualitySelector
            qualities={result.qualities}
            selectedId={selectedQuality}
            onSelect={setSelectedQuality}
            onDownload={() => void handleDownload()}
            downloading={downloading}
            downloadProgress={downloadProgress}
          />
        </div>
      ) : null}
    </>
  );
}
