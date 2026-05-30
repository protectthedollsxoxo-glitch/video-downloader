export type Platform = "youtube" | "tiktok";

export type QualityId = "480p" | "720p" | "1080p" | "4K";

export type QualityOption = {
  id: QualityId;
  label: string;
  height: number;
  formatId: string;
  audioFormatId?: string;
  hasAudio: boolean;
  /** True when YouTube serves separate DASH video + audio streams. */
  needsMerge: boolean;
  filesizeEstimate?: number;
  ext: string;
};

export type AnalyzeResponse = {
  platform: Platform;
  url: string;
  title: string;
  thumbnail?: string;
  duration?: number;
  author?: string;
  qualities: QualityOption[];
};

export type AnalyzeErrorResponse = {
  error: string;
};

export type DownloadRequest = {
  url: string;
  qualityId: QualityId;
  formatId: string;
  audioFormatId?: string;
  needsMerge: boolean;
  title?: string;
};
