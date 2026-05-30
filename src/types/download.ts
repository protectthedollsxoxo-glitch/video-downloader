export type DownloadStage =
  | "preparing"
  | "video"
  | "audio"
  | "merging"
  | "finalizing";

export type DownloadProgressUpdate = {
  percent: number;
  stage: DownloadStage;
  message: string;
};

export type DownloadSseEvent =
  | ({ type: "progress" } & DownloadProgressUpdate)
  | { type: "complete"; jobId: string; filename: string; percent: 100 }
  | { type: "error"; error: string };
