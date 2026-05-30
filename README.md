# ClipFetch — Video Downloader

A modern web app to download YouTube and TikTok videos in multiple qualities (480p–4K).

## Phase 3 (current)

- Download API at `POST /api/download`
- yt-dlp fetches the selected format
- ffmpeg merges YouTube DASH video + audio into one `.mp4`
- Download button saves the file to your device

## Phase 2

- URL auto-detection (YouTube / TikTok)
- Analyze API at `POST /api/analyze` (uses yt-dlp)
- Quality picker (480p, 720p, 1080p, 4K)
- Video preview card with thumbnail and metadata

## Phase 1

- Dark glassmorphism UI shell
- System health check at `/api/health`
- SEO metadata and ad placeholder slots

## Prerequisites

1. **Node.js** 20+ — [nodejs.org](https://nodejs.org)
2. **yt-dlp** — [github.com/yt-dlp/yt-dlp](https://github.com/yt-dlp/yt-dlp)
3. **ffmpeg** — [ffmpeg.org](https://ffmpeg.org)

On Windows (with [winget](https://learn.microsoft.com/en-us/windows/package-manager/winget/)):

```powershell
winget install yt-dlp
winget install Gyan.FFmpeg
```

## Getting started

```powershell
cd C:\Users\FES\Projects\video-downloader
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Health check: [http://localhost:3000/api/health](http://localhost:3000/api/health)

## Project structure

```
src/
  app/              # Pages and API routes
  components/       # UI and layout
  lib/              # Utilities and binary checks
```

## Build phases

| Phase | Status |
|-------|--------|
| 1 — UI shell + health | Done |
| 2 — URL detect + analyze API | Done |
| 3 — Download + ffmpeg merge | Done |
| 4 — Download progress + polish | Done |
