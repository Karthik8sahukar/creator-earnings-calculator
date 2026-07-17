import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <StaticPage
      title="Privacy"
      description="How we handle your data when you use this tool."
    >
      <h2 className="text-xl font-semibold text-slate-900">What we collect</h2>
      <p>
        This site does not require you to sign in. When you search for a
        channel, your query is sent to our server and forwarded to the YouTube
        Data API v3. We do not store your searches.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">Cookies</h2>
      <p>
        This site does not set tracking cookies. Only strictly necessary
        cookies used by the underlying platform (if any) may be set.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">Third-party services</h2>
      <p>
        We call the public YouTube Data API v3 from our server. Requests are
        subject to{" "}
        <a
          href="https://policies.google.com/privacy"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Google&apos;s privacy policy
        </a>
        .
      </p>

      <h2 className="text-xl font-semibold text-slate-900">Contact</h2>
      <p>
        For any privacy questions, open an issue on this project&apos;s
        repository.
      </p>
    </StaticPage>
  );
}
