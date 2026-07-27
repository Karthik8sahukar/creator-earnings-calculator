import type { Metadata } from "next";
import { DecisionLayout, ToolSEO } from "@/components/decision";
import { buildAlternates } from "@/lib/i18nMetadata";
import { publicConfig } from "@/lib/config";
import { DiceRollerClient } from "./DiceRollerClient";

const PATH = "/dice-roller";
const FAQ = [
  { q: "What dice types are supported?", a: "Any die from d2 to d100. Presets include d4, d6, d8, d10, d12, d20." },
  { q: "Can I roll multiple dice?", a: "Yes, up to 10 dice at once. The total is shown automatically." },
  { q: "Is each roll independent?", a: "Yes. Each die is rolled independently using Math.random()." },
  { q: "Can I use this for tabletop RPGs?", a: "Absolutely. Common D&D dice (d4, d6, d8, d10, d12, d20) are available as presets." },
];


export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Dice Roller — Roll Any Dice Online Free",
    description: "Roll virtual dice from d4 to d100. Support for multiple dice, running totals, and roll history. Perfect for tabletop RPGs and random decisions.",
    keywords: ["dice roller", "roll dice online", "d20 roller", "virtual dice", "D&D dice roller", "random dice"],
    alternates: buildAlternates({ pathSuffix: PATH }),
    openGraph: { type: "website", title: "Dice Roller — Roll Any Dice Online Free", description: "Roll virtual dice from d4 to d100.", url: `${PATH}`, siteName: publicConfig.siteName, locale },
    twitter: { card: "summary_large_image", title: "Dice Roller — Roll Any Dice Online Free", description: "Roll virtual dice from d4 to d100." },
  };
}

export default async function Page() {
  return (
    <>
      <DecisionLayout eyebrow="Decision Tool" title="Dice Roller" intro="Roll any type of die from d4 to d100. Support for multiple dice, preset configurations, running totals, and complete roll history." breadcrumbs={[{ label: "Dice Roller", href: PATH }]} faq={FAQ} currentToolPath={PATH} toolSlug="dice-roller">
        <DiceRollerClient />
      </DecisionLayout>
      <ToolSEO pathSuffix={PATH} toolName="Dice Roller" toolDescription="Virtual dice roller supporting d4 through d100 with multi-roll and history." faq={FAQ} breadcrumbName="Dice Roller" />
    </>
  );
}
