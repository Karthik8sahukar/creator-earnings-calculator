import { createToolMetadata } from "@/lib/engine";
import { ToolLayout, ToolJsonLd } from "@/components/engine";
import { JsonValidatorClient } from "./JsonValidatorClient";

const SLUG = "json-validator";
const FAQ = [
  { q: "What does this tool validate?", a: "This tool validates JSON syntax only. It checks whether your input is well-formed JSON according to the ECMA-404 standard. It does not validate against JSON Schema." },
  { q: "Is my data sent to a server?", a: "No. All validation happens locally in your browser using JSON.parse(). Your data never leaves your device." },
  { q: "What error information is provided?", a: "When JSON is invalid, the tool shows the error message, approximate line number, and column position to help you locate the issue." },
  { q: "Can it validate JSON Schema?", a: "No. This is a JSON syntax validator only. For JSON Schema validation, use a dedicated schema validation tool." },
];


export const generateMetadata = createToolMetadata(SLUG, {
  title: "JSON Validator — Check JSON Syntax Online",
  description: "Validate JSON syntax instantly with detailed error messages showing line and column positions. Free, browser-based, no data uploaded.",
  keywords: ["json validator", "json syntax checker", "validate json online", "json parser"],
});

export default async function Page() {
  return (
    <>
      <ToolLayout slug={SLUG} faq={FAQ}>
        <JsonValidatorClient />
      </ToolLayout>
      <ToolJsonLd slug={SLUG} faq={FAQ} />
    </>
  );
}
