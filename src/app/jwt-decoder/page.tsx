import type { Metadata } from "next";
import { DeveloperToolLayout } from "@/components/developer";
import { ToolSEO } from "@/components/decision";
import { buildAlternates } from "@/lib/i18nMetadata";
import { publicConfig } from "@/lib/config";
import { JwtDecoderClient } from "./JwtDecoderClient";

const PATH = "/jwt-decoder";
const FAQ = [
  { q: "Does this tool verify JWT signatures?", a: "No. This tool decodes the token only. It does not verify the signature or authenticity. Never paste tokens containing sensitive data into online tools." },
  { q: "Is my JWT sent to a server?", a: "No. All decoding happens locally in your browser using JavaScript. No data leaves your device." },
  { q: "What JWT formats are supported?", a: "Any standard JWT with three Base64URL-encoded dot-separated parts (header.payload.signature). Supports Unicode payloads." },
  { q: "How are timestamps displayed?", a: "The iat, exp, and nbf claims are automatically converted to human-readable ISO 8601 dates with expiry status." },
];


export async function generateMetadata({ params }: { /* no params */ }): Promise<Metadata> {
  return {
    title: "JWT Decoder – Decode JWT Tokens Locally",
    description: "Decode JWT tokens locally in your browser. View header, payload, claims, expiry status. No data sent to any server. Free and private.",
    keywords: ["jwt decoder", "jwt token", "decode jwt", "jwt viewer", "json web token"],
    alternates: buildAlternates({ pathSuffix: PATH }),
    openGraph: { type: "website", title: "JWT Decoder – Decode JWT Tokens Locally", description: "Decode JWT tokens locally. View claims and expiry.", url: `${publicConfig.siteUrl}${PATH}`, siteName: publicConfig.siteName, locale },
    twitter: { card: "summary_large_image", title: "JWT Decoder – Decode JWT Tokens Locally", description: "Decode JWT tokens locally. View claims and expiry." },
  };
}

export default async function Page({ params }: { /* no params */ }) {
  return (
    <>
      <DeveloperToolLayout title="JWT Decoder" intro="Decode JSON Web Tokens locally in your browser. View header, payload, claims, and expiry status without sending data anywhere." breadcrumbs={[{ label: "JWT Decoder", href: PATH }]} faq={FAQ} currentToolPath={PATH}>
        <JwtDecoderClient />
      </DeveloperToolLayout>
      <ToolSEO pathSuffix={PATH} toolName="JWT Decoder" toolDescription="Browser-based JWT token decoder with claim inspection and expiry checking." faq={FAQ} breadcrumbName="JWT Decoder" />
    </>
  );
}
