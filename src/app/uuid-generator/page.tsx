import { createToolMetadata } from "@/lib/engine";
import { ToolLayout, ToolJsonLd } from "@/components/engine";
import { UuidGeneratorClient } from "./UuidGeneratorClient";

const SLUG = "uuid-generator";
const FAQ = [
  { q: "What version of UUID is generated?", a: "UUID v4, which uses cryptographically secure random numbers. Each UUID has 122 random bits." },
  { q: "How are the UUIDs generated?", a: "We use crypto.randomUUID() when available, with a fallback to crypto.getRandomValues(). Math.random() is never used." },
  { q: "Are the generated UUIDs truly unique?", a: "With 2^122 possible values, the probability of collision is astronomically low — effectively zero for any practical use." },
  { q: "What is the maximum quantity?", a: "You can generate up to 100 UUIDs at once. For larger batches, generate multiple times." },
];


export const generateMetadata = createToolMetadata(SLUG, {
  title: "UUID Generator — Generate UUID v4 Online",
  description: "Generate cryptographically secure UUID v4 identifiers in bulk. Copy individual or all UUIDs. Uses crypto.randomUUID, never Math.random.",
  keywords: ["uuid generator", "uuid v4", "guid generator", "random uuid", "unique id"],
});

export default async function Page() {
  return (
    <>
      <ToolLayout slug={SLUG} faq={FAQ}>
        <UuidGeneratorClient />
      </ToolLayout>
      <ToolJsonLd slug={SLUG} faq={FAQ} />
    </>
  );
}
