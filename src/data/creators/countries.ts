/**
 * Country metadata for dynamic /creators/[country] pages.
 *
 * Adding a new country is a one-line entry. The route, sitemap,
 * and internal linking pick it up automatically.
 */

import type { CountryMeta } from "./schema";

export const COUNTRY_PAGES: readonly CountryMeta[] = [
  {
    slug: "india",
    label: "India",
    countryCode: "IN",
    title: "Top Indian YouTubers — Earnings & Analytics {year}",
    description: "Explore the highest-earning Indian YouTubers. Estimated revenue, RPM analysis, and channel statistics for India's top creators.",
    intro: "India is YouTube's largest market by user count, with creators producing content in Hindi, English, Tamil, Telugu, and dozens of regional languages. Despite lower RPMs compared to Western markets, top Indian creators monetize massive audiences through sponsorships, brand deals, and diversified revenue streams.",
    faq: [
      { question: "How much do Indian YouTubers earn per 1,000 views?", answer: "Indian YouTubers typically earn $1.00–$1.50 RPM for long-form content and $0.01–$0.02 for Shorts. Premium niches like finance and tech can earn up to $3–$4 RPM." },
      { question: "Who is the highest-paid Indian YouTuber?", answer: "Earnings vary by month, but creators like CarryMinati, Technical Guruji, and T-Series consistently rank among the highest earners due to massive view counts." },
      { question: "Why is Indian YouTube RPM lower than US RPM?", answer: "RPM is driven by advertiser spending power. Indian advertisers pay lower CPMs because the per-capita purchasing power and digital ad budgets are lower than in the US or UK." },
    ],
  },
  {
    slug: "usa",
    label: "United States",
    countryCode: "US",
    title: "Top American YouTubers — Earnings & Analytics {year}",
    description: "Discover how much top US YouTubers earn. Revenue estimates, RPM benchmarks, and performance analytics for America's biggest creators.",
    intro: "The United States has the highest YouTube RPMs globally, driven by massive digital advertising budgets and premium brand spending. American creators benefit from the world's largest English-speaking audience and the highest ad rates across all niches.",
    faq: [
      { question: "What is the average YouTube RPM in the US?", answer: "US creators earn approximately $4–$8 RPM for general content, with premium niches like finance reaching $12–$25 RPM." },
      { question: "How much does a US YouTuber with 1 million subscribers earn?", answer: "A US creator with 1M subscribers typically earns $5,000–$30,000/month from AdSense alone, depending on niche, upload frequency, and audience engagement." },
      { question: "Which US YouTube niches pay the most?", answer: "Personal finance, business, technology, and health niches command the highest RPMs in the US market." },
    ],
  },
  {
    slug: "uk",
    label: "United Kingdom",
    countryCode: "GB",
    title: "Top UK YouTubers — Earnings & Analytics {year}",
    description: "Explore earnings of top British YouTubers. Revenue analysis and RPM data for the UK's biggest creators.",
    intro: "The UK is one of YouTube's highest-paying markets, with RPMs comparable to Canada and Australia. British creators reach global English-speaking audiences while benefiting from strong domestic advertiser demand.",
    faq: [
      { question: "How much do UK YouTubers earn per 1,000 views?", answer: "UK creators typically earn $4–$7 RPM for long-form content, slightly below US rates but well above most European markets." },
      { question: "Who are the biggest UK YouTubers?", answer: "The Sidemen, KSI, and various gaming/entertainment creators dominate the UK YouTube scene." },
      { question: "Is YouTube a viable career in the UK?", answer: "Yes — UK creators benefit from a strong English-speaking audience, high RPMs, and a mature influencer marketing ecosystem." },
    ],
  },
  {
    slug: "canada",
    label: "Canada",
    countryCode: "CA",
    title: "Top Canadian YouTubers — Earnings & Analytics {year}",
    description: "How much do Canadian YouTubers earn? Revenue estimates and RPM analysis for Canada's top creators.",
    intro: "Canadian creators enjoy high RPMs similar to the US market, benefiting from both English and French-speaking audiences. Canada's proximity to the US advertising market means Canadian viewers generate premium ad revenue.",
    faq: [
      { question: "What is the YouTube RPM in Canada?", answer: "Canadian RPMs average $4–$7 for long-form content, comparable to UK rates and slightly below US averages." },
      { question: "Do Canadian YouTubers earn in USD or CAD?", answer: "YouTube pays in the creator's local currency (CAD for Canadian creators), but RPM benchmarks are typically quoted in USD for comparison." },
    ],
  },
  {
    slug: "germany",
    label: "Germany",
    countryCode: "DE",
    title: "Top German YouTubers — Earnings & Analytics {year}",
    description: "Discover earnings of top German YouTubers. Revenue analysis, RPM benchmarks, and channel analytics for Germany's biggest creators.",
    intro: "Germany is YouTube's largest European market by ad revenue. German-language creators benefit from strong advertiser demand in Europe's largest economy, with RPMs significantly above the global average.",
    faq: [
      { question: "How much do German YouTubers earn?", answer: "German creators earn approximately $3.50–$6 RPM for long-form content, making Germany one of the highest-paying European markets." },
      { question: "Is YouTube popular in Germany?", answer: "Yes — Germany has over 60 million YouTube users, making it the largest European audience after Russia." },
    ],
  },
  {
    slug: "japan",
    label: "Japan",
    countryCode: "JP",
    title: "Top Japanese YouTubers — Earnings & Analytics {year}",
    description: "How much do Japanese YouTubers earn? Revenue estimates and RPM analysis for Japan's top creators.",
    intro: "Japan has a thriving YouTube ecosystem with unique content styles including VTubers, variety shows, and educational content. Japanese RPMs are moderate but the market's high engagement rates and dedicated fanbase make it attractive for creators.",
    faq: [
      { question: "What is the YouTube RPM in Japan?", answer: "Japanese creators earn approximately $2.50–$5 RPM for long-form content, moderate by global standards but supported by strong viewer engagement." },
      { question: "What types of content are popular on Japanese YouTube?", answer: "VTubing, variety entertainment, gaming, educational content, and food/cooking channels are among the most popular categories in Japan." },
    ],
  },
  {
    slug: "south-korea",
    label: "South Korea",
    countryCode: "KR",
    title: "Top Korean YouTubers — Earnings & Analytics {year}",
    description: "Explore earnings of top Korean YouTubers. Revenue analysis and RPM data for South Korea's biggest creators.",
    intro: "South Korea's YouTube scene is driven by K-pop, gaming, beauty, and mukbang content. Korean creators often have highly engaged audiences and benefit from the country's advanced digital infrastructure.",
    faq: [
      { question: "How much do Korean YouTubers earn?", answer: "Korean creators earn approximately $2–$4 RPM for long-form content, with beauty and tech niches earning higher rates." },
      { question: "What content types are popular in Korean YouTube?", answer: "K-pop, ASMR, mukbang (eating shows), gaming, and beauty content dominate the Korean YouTube landscape." },
    ],
  },
  {
    slug: "brazil",
    label: "Brazil",
    countryCode: "BR",
    title: "Top Brazilian YouTubers — Earnings & Analytics {year}",
    description: "Discover how much Brazilian YouTubers earn. Revenue estimates and analytics for Brazil's top creators.",
    intro: "Brazil is Latin America's largest YouTube market, with Portuguese-language creators reaching audiences across Brazil, Portugal, and lusophone Africa. Despite lower RPMs, massive viewership numbers drive significant total earnings for top creators.",
    faq: [
      { question: "How much do Brazilian YouTubers earn per 1,000 views?", answer: "Brazilian creators earn approximately $1–$2 RPM for long-form content, lower than US/UK rates but compensated by large audience sizes." },
      { question: "Who are the biggest Brazilian YouTubers?", answer: "Creators like Whindersson Nunes, Felipe Neto, and gaming channels dominate Brazilian YouTube." },
    ],
  },
] as const;

/** Lookup a country page by slug. */
export function getCountryBySlug(slug: string): CountryMeta | undefined {
  return COUNTRY_PAGES.find((c) => c.slug === slug);
}

/** All country slugs for route generation. */
export function listCountrySlugs(): string[] {
  return COUNTRY_PAGES.map((c) => c.slug);
}
