"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

type BinaryStatus = {
  name: string;
  available: boolean;
  path: string;
  version?: string;
  error?: string;
};

type HealthResponse = {
  status: string;
  message: string;
  binaries: BinaryStatus[];
};

export function SystemStatus() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHealth() {
      try {
        const response = await fetch("/api/health");
        const data = (await response.json()) as HealthResponse;
        setHealth(data);
      } catch {
        setHealth(null);
      } finally {
        setLoading(false);
      }
    }

    void fetchHealth();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">System status</CardTitle>
          <CardDescription>
            yt-dlp is required to analyze links. ffmpeg is needed for downloads
            (Phase 3).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking media tools…
            </div>
          ) : (
            health?.binaries.map((binary) => (
              <div
                key={binary.name}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/20 px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  {binary.available ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-amber-400" />
                  )}
                  <span className="text-sm font-medium text-zinc-200">
                    {binary.name}
                  </span>
                </div>
                <Badge variant={binary.available ? "success" : "warning"}>
                  {binary.available ? "Ready" : "Missing"}
                </Badge>
              </div>
            ))
          )}
          {!loading && health?.message ? (
            <p className="text-xs text-zinc-500">{health.message}</p>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}
