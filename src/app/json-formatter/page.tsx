import { createToolMetadata } from "@/lib/engine";
import { ToolLayout, ToolJsonLd } from "@/components/engine";
import { JsonFormatterClient } from "./JsonFormatterClient";

const SLUG = "json-formatter";
const FAQ = [
  { q: "Is my JSON sent to a server?", a: "No. All formatting and validation happens locally in your browser. Your data never leaves your device." },
  { q: "What indentation options are available?", a: "You can choose 2 spaces, 4 spaces, or tabs. You can also sort object keys alphabetically." },
  { q: "Does this use eval()?", a: "No. We use JSON.parse() and JSON.stringify() exclusively, which are safe standard APIs." },
  { q: "What happens with invalid JSON?", a: "The validator shows the error message with approximate line and column position to help you find the issue." },
];


export const generateMetadata = createToolMetadata(SLUG, {
  title: "JSON Formatter & Validator Online",
  description: "Beautify, minify, and validate JSON online. Sort keys, choose indentation, download results. Free browser-based tool, no data uploaded.",
  keywords: ["json formatter", "json beautifier", "json validator", "json minifier", "format json online"],
});

export default async function Page({
  params,
}: {
  /* no params */;
}) {
  return (
    <>
      <ToolLayout slug={SLUG} faq={FAQ}>
        <JsonFormatterClient />
      </ToolLayout>
      <ToolJsonLd slug={SLUG} faq={FAQ} />
    </>
  );
}
