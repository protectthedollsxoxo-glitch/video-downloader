export type YtdlpFormat = {
  format_id: string;
  ext?: string;
  height?: number;
  width?: number;
  vcodec?: string;
  acodec?: string;
  filesize?: number;
  filesize_approx?: number;
  tbr?: number;
  abr?: number;
  format_note?: string;
  protocol?: string;
};

export type YtdlpVideoInfo = {
  id: string;
  title: string;
  thumbnail?: string;
  duration?: number;
  uploader?: string;
  webpage_url?: string;
  formats?: YtdlpFormat[];
};
