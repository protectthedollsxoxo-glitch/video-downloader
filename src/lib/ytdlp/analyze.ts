import { mapFormatsToQualities } from "@/lib/ytdlp/format-mapper";
import { fetchVideoInfo, mapYtdlpError } from "@/lib/ytdlp/runner";
import type { AnalyzeResponse } from "@/types/video";
import type { Platform } from "@/types/video";

export async function analyzeVideo(
  url: string,
  platform: Platform,
): Promise<AnalyzeResponse> {
  try {
    const info = await fetchVideoInfo(url);
    const qualities = mapFormatsToQualities(info.formats, platform);

    if (!qualities.length) {
      throw new Error("No downloadable formats found for this video.");
    }

    return {
      platform,
      url: info.webpage_url ?? url,
      title: info.title,
      thumbnail: info.thumbnail,
      duration: info.duration,
      author: info.uploader,
      qualities,
    };
  } catch (error) {
    throw new Error(mapYtdlpError(error));
  }
}
