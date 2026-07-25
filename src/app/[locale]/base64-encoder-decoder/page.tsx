import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { DeveloperToolLayout } from "@/components/developer";
import { ToolSEO } from "@/components/decision";
import { buildAlternates } from "@/lib/i18nMetadata";
import { publicConfig } from "@/lib/config";
import { routing } from "@/i18n/routing";
import { Base64Client } from "./Base64Client";

const PATH = "/base64-encoder-decoder";
const FAQ = [
  { q: "Does this tool support Unicode characters?", a: "Yes. Text is encoded as UTF-8 before Base64 encoding, so emojis, accented characters, and CJK text all work correctly." },
  { q: "What is Base64URL?", a: "Base64URL is a URL-safe variant that replaces + with -, / with _, and removes trailing = padding. It's used in JWTs and data URIs." },
  { q: "Is my data sent to a server?", a: "No. All encoding and decoding happens locally in your browser using JavaScript. No data leaves your device." },
  { q: "What is the maximum input size?", a: "There is no hard limit, but very large inputs may slow your browser. For files over 10 MB, consider a command-line tool." },
];

export function generateStaticParams() { return routing.locales.map((locale) => ({ locale })); }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Base64 Encoder and Decoder Online",
    description: "Encode and decode Base64 and Base64URL online. Supports Unicode, shows byte counts. Free browser-based tool, no data uploaded.",
    keywords: ["base64 encoder", "base64 decoder", "base64url", "encode base64", "decode base64"],
    alternates: buildAlternates({ locale, pathSuffix: PATH }),
    openGraph: { type: "website", title: "Base64 Encoder and Decoder Online", description: "Encode and decode Base64 locally. Supports Unicode and Base64URL.", url: `${publicConfig.siteUrl}/${locale}${PATH}`, siteName: publicConfig.siteName, locale },
    twitter: { card: "summary_large_image", title: "Base64 Encoder and Decoder Online", description: "Encode and decode Base64 locally. Supports Unicode and Base64URL." },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <DeveloperToolLayout title="Base64 Encoder / Decoder" intro="Encode text to Base64 or decode Base64 back to text. Supports standard Base64 and URL-safe Base64URL. All processing happens in your browser." breadcrumbs={[{ label: "Base64 Encoder / Decoder", href: PATH }]} faq={FAQ} currentToolPath={PATH}>
        <Base64Client />
      </DeveloperToolLayout>
      <ToolSEO locale={locale} pathSuffix={PATH} toolName="Base64 Encoder & Decoder" toolDescription="Browser-based Base64 and Base64URL encoder/decoder with Unicode support and byte count display." faq={FAQ} breadcrumbName="Base64 Encoder / Decoder" />
    </>
  );
}
