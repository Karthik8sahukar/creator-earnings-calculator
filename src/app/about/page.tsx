import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";
import { publicConfig } from "@/lib/config";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <StaticPage
      title={`About ${publicConfig.siteName}`}
      description="What this tool is, and what it is not."
    >
      <p>
        {publicConfig.siteName} is a free, open, independent tool for
        exploring publicly-available data about YouTube channels and getting
        a rough sense of what a creator&apos;s ad revenue might look like.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">Why we built it</h2>
      <p>
        Creator earnings numbers on the internet are all over the map.
        Different sites use wildly different assumptions and rarely explain
        them. We wanted a tool that (1) uses only the official YouTube API,
        (2) shows its work, and (3) lets you tune the assumptions yourself.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">What it uses</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Next.js App Router + React Server Components</li>
        <li>TypeScript, Tailwind CSS, Zod</li>
        <li>The official YouTube Data API v3</li>
      </ul>

      <h2 className="text-xl font-semibold text-slate-900">
        What it is not
      </h2>
      <p>
        This is not YouTube. This is not Google. This is not financial advice.
        Numbers you see are estimates. See our{" "}
        <a href="/methodology" className="underline">
          methodology
        </a>{" "}
        and{" "}
        <a href="/disclaimer" className="underline">
          disclaimer
        </a>
        .
      </p>
    </StaticPage>
  );
}
