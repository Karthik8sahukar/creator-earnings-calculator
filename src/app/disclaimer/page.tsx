import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = { title: "Disclaimer" };

export default function DisclaimerPage() {
  return (
    <StaticPage title="Disclaimer">
      <p>
        This site is an independent tool. It is not affiliated with, endorsed
        by, or verified by YouTube, Google, or any of the creators shown.
      </p>
      <p>
        Public channel statistics displayed on this site are retrieved using
        the official YouTube Data API v3. Revenue figures are estimates
        produced independently by this tool. Actual creator earnings are
        private and known only to the creator, YouTube, and — where
        applicable — their tax authorities.
      </p>
      <p>
        Do not use these estimates as the basis of any financial, tax,
        business, or legal decision. If you are the owner of a channel shown
        here and want a correction, please contact us through the project
        repository.
      </p>
    </StaticPage>
  );
}
