import type { Metadata } from "next";
import { DeveloperToolLayout } from "@/components/developer";
import { ToolSEO } from "@/components/decision";
import { buildAlternates } from "@/lib/i18nMetadata";
import { publicConfig } from "@/lib/config";
import { UrlCodecClient } from "./UrlCodecClient";

const PATH = "/url-encoder-decoder";
const FAQ = [
  { q: "What is the difference between encodeURI and encodeURIComponent?", a: "encodeURI leaves reserved characters (://?#[]@!$&'()*+,;=) intact, making it suitable for full URLs. encodeURIComponent encodes everything except A-Z a-z 0-9 - _ . ~, making it suitable for query parameters." },
  { q: "Which reserved characters are not encoded by encodeURI?", a: "The characters : / ? # [ ] @ ! $ & ' ( ) * + , ; = are preserved by encodeURI because they have special meaning in a URL structure." },
  { q: "Is my data sent to a server?", a: "No. All encoding and decoding happens locally in your browser using built-in JavaScript functions. No data leaves your device." },
  { q: "What happens with malformed percent-encoded sequences?", a: "The tool will display an error message if the input contains invalid percent-encoding sequences like %GG or incomplete sequences like %2." },
];


export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "URL Encoder and Decoder Online",
    description: "Encode and decode URLs and URI components locally in your browser. Supports full URI and component modes with a common encodings reference table.",
    keywords: ["url encoder", "url decoder", "encodeURIComponent", "percent encoding", "uri encoder"],
    alternates: buildAlternates({ pathSuffix: PATH }),
    openGraph: { type: "website", title: "URL Encoder and Decoder Online", description: "Encode and decode URLs locally. Free and private.", url: `${publicConfig.siteUrl}${PATH}`, siteName: publicConfig.siteName, locale },
    twitter: { card: "summary_large_image", title: "URL Encoder and Decoder Online", description: "Encode and decode URLs locally. Free and private." },
  };
}

export default async function Page() {
  return (
    <>
      <DeveloperToolLayout title="URL Encoder/Decoder" intro="Encode and decode URLs and URI components locally in your browser. Choose between full URI mode and component mode." breadcrumbs={[{ label: "URL Encoder/Decoder", href: PATH }]} faq={FAQ} currentToolPath={PATH}>
        <UrlCodecClient />
      </DeveloperToolLayout>
      <ToolSEO pathSuffix={PATH} toolName="URL Encoder/Decoder" toolDescription="Browser-based URL encoding and decoding with full URI and component modes." faq={FAQ} breadcrumbName="URL Encoder/Decoder" />
    </>
  );
}
