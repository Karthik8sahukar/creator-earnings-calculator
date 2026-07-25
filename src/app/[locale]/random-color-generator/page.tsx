import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { DecisionLayout, ToolSEO } from "@/components/decision";
import { buildAlternates } from "@/lib/i18nMetadata";
import { publicConfig } from "@/lib/config";
import { routing } from "@/i18n/routing";
import { RandomColorClient } from "./RandomColorClient";

const PATH = "/random-color-generator";
const FAQ = [
  { q: "How does the random color generator work?", a: "Each color is generated using random RGB values (0-255 for each channel). We then convert to HEX, HSL, HSV, and CMYK representations automatically." },
  { q: "What color formats are supported?", a: "We display every color in HEX, RGB, HSL, HSV, and CMYK (approximation). Click Copy on any format to use it in your CSS, design tool, or print workflow." },
  { q: "What are the palette modes?", a: "Complementary uses the opposite hue (180°), Analogous uses adjacent hues (±30°), Triadic uses three evenly-spaced hues (120° apart), and Monochrome varies lightness within the same hue." },
  { q: "Is the contrast check WCAG compliant?", a: "Yes. We calculate contrast ratio per WCAG 2.1 guidelines. AA requires 4.5:1 for normal text, and we show whether the color passes on white or black backgrounds." },
  { q: "Can I lock a color?", a: "Yes. Click Lock Color to keep the current color while generating palettes and gradients based on it." },
];

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Random Color Generator — HEX, RGB, HSL Palette Tool",
    description: "Generate random colors with HEX, RGB, HSL, HSV, CMYK values. Create palettes, check WCAG contrast, and generate CSS gradients. Free online color tool.",
    keywords: ["random color generator", "color palette generator", "hex color", "rgb color", "color picker", "WCAG contrast", "CSS gradient generator"],
    alternates: buildAlternates({ locale, pathSuffix: PATH }),
    openGraph: { type: "website", title: "Random Color Generator — HEX, RGB, HSL Palette Tool", description: "Generate random colors and palettes with WCAG contrast checking.", url: `${publicConfig.siteUrl}/${locale}${PATH}`, siteName: publicConfig.siteName, locale },
    twitter: { card: "summary_large_image", title: "Random Color Generator — HEX, RGB, HSL Palette Tool", description: "Generate random colors and palettes with WCAG contrast checking." },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <DecisionLayout
        eyebrow="Design Tool"
        title="Random Color Generator"
        intro="Generate random colors instantly with HEX, RGB, HSL, HSV, and CMYK values. Create palettes, check accessibility contrast, and generate CSS gradients."
        breadcrumbs={[{ label: "Random Color Generator", href: PATH }]}
        faq={FAQ}
        currentToolPath={PATH}
      >
        <RandomColorClient />
      </DecisionLayout>
      <ToolSEO
        locale={locale}
        pathSuffix={PATH}
        toolName="Random Color Generator"
        toolDescription="Generate random colors with multiple format support, palette generation, and WCAG contrast checking."
        faq={FAQ}
        breadcrumbName="Random Color Generator"
      />
    </>
  );
}
