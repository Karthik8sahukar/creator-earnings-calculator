import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { ChannelDashboard } from "@/components/ChannelDashboard";
import { PerformanceCard } from "@/components/PerformanceCard";
import { ProfileCard } from "@/components/ProfileCard";
import { TransparencyBanner } from "@/components/TransparencyBanner";
import { VideosGrid } from "@/components/VideosGrid";
import { Link } from "@/i18n/navigation";
import { decodeCalculatorState } from "@/lib/calculatorState";
import { publicConfig } from "@/lib/config";
import { buildAlternates } from "@/lib/i18nMetadata";
import { analyzePerformance } from "@/lib/performance";
import { channelIdSchema } from "@/lib/schemas";
import {
  YouTubeApiError,
  getChannelById,
  getRecentVideos,
} from "@/lib/youtube";
import type { VideoItem } from "@/types/youtube";

export const runtime = "nodejs";
// Channels are dynamic per-id; static generation isn't a fit here.
export const dynamic = "force-dynamic";

interface RouteParams {
  locale: string;
  channelId: string;
}

interface RouteSearchParams {
  [key: string]: string | string[] | undefined;
}

interface PageProps {
  params: Promise<RouteParams>;
  searchParams: Promise<RouteSearchParams>;
}

async function resolveChannel(rawId: string) {
  const parsed = channelIdSchema.safeParse({ channelId: rawId });
  if (!parsed.success) return null;
  return getChannelById(parsed.data.channelId);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { locale, channelId } = await params;
  const t = await getTranslations({ locale, namespace: "channelPage" });

  let channel: Awaited<ReturnType<typeof resolveChannel>> = null;
  try {
    channel = await resolveChannel(channelId);
  } catch {
    // Upstream failure — fall through to generic metadata.
  }

  if (!channel) {
    return {
      title: t("notFoundTitle"),
      description: t("notFoundBody"),
      alternates: { canonical: `/${locale}` },
      robots: { index: false, follow: true },
    };
  }

  const title = `Estimated Earnings for ${channel.title} | ${publicConfig.siteName}`;
  const description = `View public YouTube channel statistics and independent earning estimates for ${channel.title}.`;
  const canonicalSuffix = `/channel/${channel.channelId}`;
  const ogImage = channel.thumbnail || undefined;

  return {
    title,
    description,
    alternates: buildAlternates({ locale, pathSuffix: canonicalSuffix }),
    openGraph: {
      type: "website",
      url: `${publicConfig.siteUrl}/${locale}${canonicalSuffix}`,
      title,
      description,
      siteName: publicConfig.siteName,
      images: ogImage ? [{ url: ogImage, alt: channel.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function ChannelPage({ params, searchParams }: PageProps) {
  const { locale, channelId } = await params;
  setRequestLocale(locale);

  const search = await searchParams;
  const t = await getTranslations({ locale, namespace: "channelPage" });
  const tVideos = await getTranslations({ locale, namespace: "videos" });

  let channel: Awaited<ReturnType<typeof resolveChannel>> = null;
  try {
    channel = await resolveChannel(channelId);
  } catch (err) {
    if (err instanceof YouTubeApiError && err.code === "NOT_FOUND") {
      notFound();
    }
    throw err;
  }

  if (!channel) notFound();

  let videos: VideoItem[] = [];
  try {
    videos = await getRecentVideos(channel.uploadsPlaylistId);
  } catch (err) {
    // Log server-side and continue.
    console.error("channel-page:getRecentVideos failed", {
      channelId: channel.channelId,
      code: err instanceof YouTubeApiError ? err.code : "UNEXPECTED",
    });
  }

  const analysis = analyzePerformance(videos);
  const initialCalculatorState = decodeCalculatorState(search);

  return (
    <div className="space-y-8">
      <nav aria-label={t("breadcrumbAria")} className="text-sm text-slate-500">
        <Link href="/" className="hover:text-brand-700 focus:text-brand-700">
          {t("backToSearch")}
        </Link>
      </nav>

      <ProfileCard channel={channel} />
      <TransparencyBanner />
      <PerformanceCard analysis={analysis} />

      <ChannelDashboard
        channel={channel}
        analysis={analysis}
        initialCalculatorState={initialCalculatorState}
      />

      <section aria-labelledby="videos-title" className="space-y-4">
        <h2 id="videos-title" className="text-lg font-semibold text-slate-900">
          {tVideos("sectionTitle")}
        </h2>
        {videos.length > 0 ? (
          <VideosGrid videos={videos} />
        ) : (
          <p className="text-sm text-slate-500">{tVideos("empty")}</p>
        )}
      </section>
    </div>
  );
}
