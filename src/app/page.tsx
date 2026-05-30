import { AdSlot } from "@/components/ad-slot";
import { DownloaderPanel } from "@/components/downloader/downloader-panel";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

export default function Home() {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
        aria-hidden
      />

      <AdSlot position="left" />
      <AdSlot position="right" />

      <Header />

      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 pb-12 sm:px-8 lg:px-12">
        <DownloaderPanel />
      </main>

      <Footer />
    </div>
  );
}
