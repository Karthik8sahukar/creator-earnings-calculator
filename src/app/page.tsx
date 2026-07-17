import { ChannelWorkspace } from "@/components/ChannelWorkspace";

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section aria-labelledby="hero-title" className="text-center space-y-4 pt-6 sm:pt-10">
        <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 text-brand-700 px-3 py-1 text-xs font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
          Powered by the YouTube Data API v3
        </p>
        <h1
          id="hero-title"
          className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900"
        >
          Search Any YouTube Channel
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-slate-600">
          Estimate creator earnings using public YouTube statistics.
        </p>
      </section>

      <ChannelWorkspace />
    </div>
  );
}
