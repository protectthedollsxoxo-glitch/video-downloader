import type { DownloadSseEvent } from "@/types/download";

/** Parses Server-Sent Events from a fetch response body stream. */
export async function consumeDownloadStream(
  response: Response,
  onEvent: (event: DownloadSseEvent) => void,
): Promise<void> {
  if (!response.body) {
    throw new Error("No response body.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const line = part
        .split("\n")
        .find((entry) => entry.startsWith("data: "));
      if (!line) continue;

      const json = line.slice(6).trim();
      if (!json) continue;

      onEvent(JSON.parse(json) as DownloadSseEvent);
    }
  }
}
