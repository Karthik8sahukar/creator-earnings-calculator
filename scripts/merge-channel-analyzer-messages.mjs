#!/usr/bin/env node
/**
 * Merge Channel Analyzer message keys into every locale bundle.
 *
 * Follows the same shape as scripts/merge-creator-messages.mjs:
 *   • English (en) is authoritative and receives the full key set.
 *   • Every non-English locale first receives the English fallback
 *     for the whole `tools.channelAnalyzer` subtree — so no rendered
 *     key ever comes back as a raw "not.found" string — and then
 *     gets locale-specific translated chrome layered on top.
 *   • Idempotent — running twice produces identical output.
 *   • Preserves deep-merge behaviour so unrelated existing keys are
 *     untouched.
 *
 * When a professional translator ships full localized copy for the
 * analyzer surface, this file is the one place to edit.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const messagesDir = path.join(__dirname, "..", "messages");

const LOCALES = ["en", "hi", "es", "pt", "de", "fr", "ja"];

function deepMerge(target, source) {
  if (source === null || typeof source !== "object") return source;
  if (target === null || typeof target !== "object") return { ...source };
  const out = { ...target };
  for (const [k, v] of Object.entries(source)) out[k] = deepMerge(target?.[k], v);
  return out;
}

// ─────────────────────────────────────────────────────────────────
//   English source-of-truth for the Channel Analyzer
// ─────────────────────────────────────────────────────────────────

const EN_CHANNEL_ANALYZER = {
  breadcrumb: "Channel Analyzer",
  breadcrumbAria: "Breadcrumb",
  hero: {
    eyebrow: "Free tool · No login",
    title: "Analyze Any YouTube Channel",
    subtitle:
      "Paste a YouTube channel URL, handle, or ID and get an instant snapshot: subscribers, views, engagement, estimated earnings, RPM, CPM, and top videos — all in one place.",
    badges: {
      free: "100% free",
      noLogin: "No login required",
      estimatesOnly: "Estimates only",
    },
  },
  input: {
    label: "YouTube channel URL, handle or ID",
    placeholder:
      "https://www.youtube.com/@MrBeast — or @MrBeast, or a channel ID",
    submit: "Analyze Channel",
    analyzing: "Analyzing…",
    clearAria: "Clear input",
    formAria: "Analyze a YouTube channel",
    helpSr:
      "Supports channel URLs, handles with or without the @ prefix, raw channel IDs, and channel names.",
  },
  card: {
    subscribers: "Subscribers",
    totalViews: "Total views",
    videos: "Videos",
    joined: "Joined",
  },
  performance: {
    title: "Performance & earnings snapshot",
    disclaimer:
      "All figures are independent estimates based on public statistics. Actual YouTube revenue depends on ad category mix, monetization rate, seasonality, taxes, and other factors we cannot observe.",
    monthlyEarnings: {
      label: "Estimated monthly earnings",
      title: "Estimated monthly ad revenue",
      caption: "Range: {range}",
    },
    yearlyEarnings: {
      label: "Estimated yearly earnings",
      title: "Estimated annual ad revenue",
      caption: "Range: {range}",
    },
    rpm: {
      label: "Estimated RPM",
      title: "Revenue per 1,000 total views (creator side)",
      caption: "Based on {country} audience mix",
    },
    cpm: {
      label: "Estimated CPM",
      title: "Advertiser cost per 1,000 monetized impressions",
      caption: "Before YouTube's revenue share",
    },
    averageViews: {
      label: "Average views",
      caption:
        "{count, plural, =0 {No sample} one {From last upload} other {From last # uploads}}",
    },
    uploadFrequency: {
      label: "Upload frequency",
      value:
        "{count, plural, =0 {No recent uploads} one {# / month} other {# / month}}",
      caption: "Based on the last 30 days",
    },
    engagementRate: {
      label: "Engagement rate",
      caption: "Likes plus comments per view",
    },
    growthScore: {
      label: "Growth score",
      labels: {
        quiet: "Quiet — low recent activity",
        steady: "Steady — consistent baseline",
        growing: "Growing — momentum building",
        thriving: "Thriving — strong signals",
      },
    },
  },
  topVideos: {
    title: "Top videos",
    subtitle:
      "{count, plural, =0 {No videos yet} one {# highest-viewed upload} other {# highest-viewed uploads}}",
    watchOnYouTube: "Watch on YouTube",
  },
  aiSummary: {
    title: "AI Insights",
    badge: "Coming soon",
    placeholderTitle: "AI insights coming soon.",
    placeholderBody:
      "We're building an AI layer that will summarize a channel's growth trajectory, monetization opportunities, and content strategy in plain English. It will plug into this section without changing the rest of the report.",
  },
  related: {
    title: "Related free tools",
    subtitle:
      "Use the numbers above as inputs to any of our other creator calculators.",
    links: {
      money: {
        title: "YouTube Money Calculator",
        description: "Estimate a channel's monthly revenue.",
      },
      rpm: {
        title: "RPM Calculator",
        description: "Revenue per 1,000 monetized views.",
      },
      cpm: {
        title: "CPM Calculator",
        description: "Advertiser cost per 1,000 impressions.",
      },
      shorts: {
        title: "Shorts Calculator",
        description: "Estimate Shorts Creator Pool payouts.",
      },
      sponsorship: {
        title: "Sponsorship Calculator",
        description: "Estimate brand deal rates.",
      },
    },
  },
  loading: {
    sr: "Analyzing channel…",
  },
  results: {
    emptyTitle: "Paste a YouTube channel to get started",
    emptyBody:
      "The Channel Analyzer accepts any YouTube channel URL, handle, or channel ID. Try one of these formats:",
    emptyExamples: {
      url: "youtube.com/@MrBeast",
      handle: "@MrBeast",
      id: "UCX6OQ3DkcsbYNE6H8uQQuVA",
      name: "MrBeast",
    },
    noVideosTitle: "No recent uploads found",
    noVideosBody:
      "This channel doesn't have any recent uploads we can sample. Earnings and engagement estimates need a video sample to be reliable.",
    errors: {
      echoInput: "You entered: {input}",
      "invalid-input": {
        title: "That input doesn't look right",
        body:
          "Please double-check the URL, handle, or channel ID and try again.",
      },
      "not-found": {
        title: "We couldn't find that channel",
        body:
          "No public YouTube channel matched that input. Try pasting the full channel URL or the @handle exactly as it appears on YouTube.",
      },
      "not-configured": {
        title: "Channel Analyzer isn't fully configured",
        body:
          "The server is missing a YouTube API key. If you're the operator, set YOUTUBE_API_KEY in your environment.",
      },
      "quota-exceeded": {
        title: "Daily API quota reached",
        body:
          "We've temporarily hit YouTube's daily API quota. Please try again in a few hours.",
      },
      "upstream-unavailable": {
        title: "YouTube is not responding",
        body:
          "YouTube's API is currently unreachable or timing out. Please try again shortly.",
      },
      "empty-input": {
        title: "Enter a channel to analyze",
        body: "Paste a YouTube channel URL, @handle, channel ID, or channel name above.",
      },
      "unknown-error": {
        title: "Something went wrong",
        body:
          "We couldn't complete the analysis for that channel. Please try again in a moment.",
      },
    },
  },
  routeError: {
    title: "Channel Analyzer ran into a problem",
    body:
      "Something unexpected happened while rendering the report. Please try again — your input is preserved in the URL.",
    startOver: "Start over",
  },
  meta: {
    title: "YouTube Channel Analyzer — Earnings, Stats & Top Videos",
    description:
      "Analyze any YouTube channel in seconds. Get estimated earnings, RPM, CPM, engagement, top videos, and a growth snapshot. Free, no login required.",
    ogDescription:
      "Paste any YouTube channel URL or handle to get estimated monthly earnings, RPM, CPM, engagement, top videos, and a growth score. Free tool.",
  },
};

// ─────────────────────────────────────────────────────────────────
//   Nav / footer chrome that needs to appear in every locale so the
//   new dropdown + footer entries never render an untranslated key.
// ─────────────────────────────────────────────────────────────────

const EN_ADDITIONS = {
  nav: {
    channelAnalyzer: "Channel Analyzer",
    channelAnalyzerAria: "Open the YouTube Channel Analyzer",
  },
  footer: {
    channelAnalyzer: "Channel Analyzer",
  },
  calculatorsMenu: {
    channelAnalyzer: {
      label: "Channel Analyzer",
      description: "Instant snapshot of any YouTube channel.",
    },
  },
  tools: {
    channelAnalyzer: EN_CHANNEL_ANALYZER,
  },
};

// ─────────────────────────────────────────────────────────────────
//   Locale-specific chrome overrides. Only strings a non-English
//   reader will actually SEE get translated here — the analyzer's
//   long-form editorial copy (error bodies, disclaimers, FAQ) stays
//   in English for phase-1, matching how blog articles are handled.
// ─────────────────────────────────────────────────────────────────

const LOCALIZED = {
  en: {},
  es: {
    nav: {
      channelAnalyzer: "Analizador de canal",
      channelAnalyzerAria: "Abrir el analizador de canal de YouTube",
    },
    footer: { channelAnalyzer: "Analizador de canal" },
    calculatorsMenu: {
      channelAnalyzer: {
        label: "Analizador de canal",
        description: "Vista instantánea de cualquier canal de YouTube.",
      },
    },
    tools: {
      channelAnalyzer: {
        breadcrumb: "Analizador de canal",
        hero: {
          eyebrow: "Herramienta gratuita · Sin registro",
          title: "Analiza cualquier canal de YouTube",
          subtitle:
            "Pega la URL, el @handle o el ID de un canal de YouTube y obtén al instante una vista completa: suscriptores, visualizaciones, interacción, ingresos estimados, RPM, CPM y los mejores vídeos.",
          badges: {
            free: "100% gratis",
            noLogin: "Sin registro",
            estimatesOnly: "Solo estimaciones",
          },
        },
        input: {
          label: "URL, handle o ID del canal de YouTube",
          placeholder:
            "https://www.youtube.com/@MrBeast — o @MrBeast, o un ID de canal",
          submit: "Analizar canal",
          analyzing: "Analizando…",
          clearAria: "Borrar entrada",
          formAria: "Analizar un canal de YouTube",
        },
        meta: {
          title:
            "Analizador de canales de YouTube — Ingresos, estadísticas y mejores vídeos",
          description:
            "Analiza cualquier canal de YouTube en segundos. Ingresos estimados, RPM, CPM, interacción, mejores vídeos y crecimiento. Gratis, sin registro.",
          ogDescription:
            "Pega cualquier URL o handle de un canal de YouTube para obtener ingresos mensuales estimados, RPM, CPM, interacción y sus mejores vídeos.",
        },
      },
    },
  },
  pt: {
    nav: {
      channelAnalyzer: "Analisador de canal",
      channelAnalyzerAria: "Abrir o analisador de canal do YouTube",
    },
    footer: { channelAnalyzer: "Analisador de canal" },
    calculatorsMenu: {
      channelAnalyzer: {
        label: "Analisador de canal",
        description: "Panorama instantâneo de qualquer canal do YouTube.",
      },
    },
    tools: {
      channelAnalyzer: {
        breadcrumb: "Analisador de canal",
        hero: {
          eyebrow: "Ferramenta gratuita · Sem login",
          title: "Analisa qualquer canal do YouTube",
          subtitle:
            "Cola o URL, o @handle ou o ID de um canal do YouTube e obtém instantaneamente uma visão completa: subscritores, visualizações, engagement, ganhos estimados, RPM, CPM e os melhores vídeos.",
          badges: {
            free: "100% gratuito",
            noLogin: "Sem login",
            estimatesOnly: "Apenas estimativas",
          },
        },
        input: {
          label: "URL, handle ou ID do canal do YouTube",
          placeholder:
            "https://www.youtube.com/@MrBeast — ou @MrBeast, ou um ID de canal",
          submit: "Analisar canal",
          analyzing: "A analisar…",
          clearAria: "Limpar entrada",
          formAria: "Analisar um canal do YouTube",
        },
        meta: {
          title:
            "Analisador de canais do YouTube — Ganhos, estatísticas e melhores vídeos",
          description:
            "Analisa qualquer canal do YouTube em segundos. Ganhos estimados, RPM, CPM, engagement, melhores vídeos e crescimento. Gratuito, sem login.",
          ogDescription:
            "Cola qualquer URL ou handle de um canal do YouTube para obter ganhos mensais estimados, RPM, CPM, engagement e os melhores vídeos.",
        },
      },
    },
  },
  fr: {
    nav: {
      channelAnalyzer: "Analyseur de chaîne",
      channelAnalyzerAria: "Ouvrir l'analyseur de chaîne YouTube",
    },
    footer: { channelAnalyzer: "Analyseur de chaîne" },
    calculatorsMenu: {
      channelAnalyzer: {
        label: "Analyseur de chaîne",
        description: "Aperçu instantané de n'importe quelle chaîne YouTube.",
      },
    },
    tools: {
      channelAnalyzer: {
        breadcrumb: "Analyseur de chaîne",
        hero: {
          eyebrow: "Outil gratuit · Sans inscription",
          title: "Analysez n'importe quelle chaîne YouTube",
          subtitle:
            "Collez l'URL, le @handle ou l'ID d'une chaîne YouTube et obtenez un aperçu instantané : abonnés, vues, engagement, revenus estimés, RPM, CPM et meilleures vidéos.",
          badges: {
            free: "100% gratuit",
            noLogin: "Sans inscription",
            estimatesOnly: "Estimations uniquement",
          },
        },
        input: {
          label: "URL, handle ou ID de la chaîne YouTube",
          placeholder:
            "https://www.youtube.com/@MrBeast — ou @MrBeast, ou un ID de chaîne",
          submit: "Analyser la chaîne",
          analyzing: "Analyse en cours…",
          clearAria: "Effacer la saisie",
          formAria: "Analyser une chaîne YouTube",
        },
        meta: {
          title:
            "Analyseur de chaîne YouTube — Revenus, statistiques et meilleures vidéos",
          description:
            "Analysez n'importe quelle chaîne YouTube en quelques secondes. Revenus estimés, RPM, CPM, engagement, meilleures vidéos et croissance. Gratuit, sans inscription.",
          ogDescription:
            "Collez n'importe quelle URL ou handle d'une chaîne YouTube pour obtenir revenus mensuels estimés, RPM, CPM, engagement et meilleures vidéos.",
        },
      },
    },
  },
  de: {
    nav: {
      channelAnalyzer: "Kanal-Analyzer",
      channelAnalyzerAria: "YouTube-Kanal-Analyzer öffnen",
    },
    footer: { channelAnalyzer: "Kanal-Analyzer" },
    calculatorsMenu: {
      channelAnalyzer: {
        label: "Kanal-Analyzer",
        description: "Sofortiger Überblick über jeden YouTube-Kanal.",
      },
    },
    tools: {
      channelAnalyzer: {
        breadcrumb: "Kanal-Analyzer",
        hero: {
          eyebrow: "Kostenloses Tool · Ohne Anmeldung",
          title: "Analysiere jeden YouTube-Kanal",
          subtitle:
            "Füge die URL, den @Handle oder die ID eines YouTube-Kanals ein und erhalte sofort einen Überblick: Abonnenten, Aufrufe, Engagement, geschätzte Einnahmen, RPM, CPM und Top-Videos.",
          badges: {
            free: "100% kostenlos",
            noLogin: "Ohne Anmeldung",
            estimatesOnly: "Nur Schätzungen",
          },
        },
        input: {
          label: "YouTube-Kanal-URL, Handle oder ID",
          placeholder:
            "https://www.youtube.com/@MrBeast — oder @MrBeast, oder eine Kanal-ID",
          submit: "Kanal analysieren",
          analyzing: "Analysiere…",
          clearAria: "Eingabe löschen",
          formAria: "Einen YouTube-Kanal analysieren",
        },
        meta: {
          title:
            "YouTube-Kanal-Analyzer — Einnahmen, Statistiken & Top-Videos",
          description:
            "Analysiere jeden YouTube-Kanal in Sekunden. Geschätzte Einnahmen, RPM, CPM, Engagement, Top-Videos und Wachstum. Kostenlos, ohne Anmeldung.",
          ogDescription:
            "Füge eine beliebige YouTube-Kanal-URL oder ein Handle ein für geschätzte monatliche Einnahmen, RPM, CPM, Engagement und Top-Videos.",
        },
      },
    },
  },
  hi: {
    nav: {
      channelAnalyzer: "चैनल एनालाइज़र",
      channelAnalyzerAria: "YouTube चैनल एनालाइज़र खोलें",
    },
    footer: { channelAnalyzer: "चैनल एनालाइज़र" },
    calculatorsMenu: {
      channelAnalyzer: {
        label: "चैनल एनालाइज़र",
        description: "किसी भी YouTube चैनल का त्वरित विश्लेषण।",
      },
    },
    tools: {
      channelAnalyzer: {
        breadcrumb: "चैनल एनालाइज़र",
        hero: {
          eyebrow: "मुफ़्त टूल · कोई लॉगिन नहीं",
          title: "किसी भी YouTube चैनल का विश्लेषण करें",
          subtitle:
            "YouTube चैनल का URL, @handle या ID पेस्ट करें और तुरंत पाएं: सब्सक्राइबर, व्यूज़, एंगेजमेंट, अनुमानित कमाई, RPM, CPM और शीर्ष वीडियो।",
          badges: {
            free: "100% मुफ़्त",
            noLogin: "कोई लॉगिन नहीं",
            estimatesOnly: "केवल अनुमान",
          },
        },
        input: {
          label: "YouTube चैनल URL, handle या ID",
          placeholder:
            "https://www.youtube.com/@MrBeast — या @MrBeast, या चैनल ID",
          submit: "चैनल का विश्लेषण करें",
          analyzing: "विश्लेषण हो रहा है…",
          clearAria: "इनपुट साफ़ करें",
          formAria: "YouTube चैनल का विश्लेषण करें",
        },
        meta: {
          title:
            "YouTube चैनल एनालाइज़र — कमाई, आँकड़े और शीर्ष वीडियो",
          description:
            "किसी भी YouTube चैनल का सेकंडों में विश्लेषण करें। अनुमानित कमाई, RPM, CPM, एंगेजमेंट, शीर्ष वीडियो और ग्रोथ। मुफ़्त, बिना लॉगिन।",
          ogDescription:
            "किसी भी YouTube चैनल URL या handle को पेस्ट करें — अनुमानित मासिक कमाई, RPM, CPM, एंगेजमेंट और शीर्ष वीडियो पाएं।",
        },
      },
    },
  },
  ja: {
    nav: {
      channelAnalyzer: "チャンネル分析",
      channelAnalyzerAria: "YouTube チャンネル分析を開く",
    },
    footer: { channelAnalyzer: "チャンネル分析" },
    calculatorsMenu: {
      channelAnalyzer: {
        label: "チャンネル分析",
        description: "任意の YouTube チャンネルの瞬時サマリー。",
      },
    },
    tools: {
      channelAnalyzer: {
        breadcrumb: "チャンネル分析",
        hero: {
          eyebrow: "無料ツール · ログイン不要",
          title: "任意の YouTube チャンネルを分析",
          subtitle:
            "YouTube チャンネルの URL・@ハンドル・ID を貼り付けるだけで、登録者数・視聴回数・エンゲージメント・推定収益・RPM・CPM・トップ動画を即座に表示します。",
          badges: {
            free: "100% 無料",
            noLogin: "ログイン不要",
            estimatesOnly: "推定値のみ",
          },
        },
        input: {
          label: "YouTube チャンネル URL、ハンドル、または ID",
          placeholder:
            "https://www.youtube.com/@MrBeast — または @MrBeast、チャンネル ID",
          submit: "チャンネルを分析",
          analyzing: "分析中…",
          clearAria: "入力をクリア",
          formAria: "YouTube チャンネルを分析",
        },
        meta: {
          title:
            "YouTube チャンネル分析 — 収益・統計・トップ動画",
          description:
            "任意の YouTube チャンネルを数秒で分析。推定収益、RPM、CPM、エンゲージメント、トップ動画、成長スコア。無料・登録不要。",
          ogDescription:
            "YouTube チャンネルの URL やハンドルを貼り付けて、推定月間収益、RPM、CPM、エンゲージメント、トップ動画を確認。",
        },
      },
    },
  },
};

async function main() {
  for (const locale of LOCALES) {
    const filepath = path.join(messagesDir, `${locale}.json`);
    const raw = await fs.readFile(filepath, "utf8");
    const existing = JSON.parse(raw);
    // Layer order: existing → English fallback (fills every key) →
    // locale overrides (translates visible chrome). This guarantees
    // no key ever renders as "tools.channelAnalyzer.foo.bar".
    const merged = deepMerge(
      deepMerge(existing, EN_ADDITIONS),
      LOCALIZED[locale] ?? {},
    );
    const output = JSON.stringify(merged, null, 2) + "\n";
    await fs.writeFile(filepath, output, "utf8");
    process.stdout.write(`  updated ${locale}.json\n`);
  }
  process.stdout.write("done.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
