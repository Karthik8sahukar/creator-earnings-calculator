import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CreatorCard } from "../CreatorCard";
import type { Creator } from "@/lib/creators";

const sample: Creator = {
  slug: "sample-creator",
  displayName: "Sample Creator",
  youtubeHandle: "@sample",
  channelId: "",
  country: "USA",
  category: "Entertainment",
  description: "A short summary of the creator that fits within the card body.",
  relatedCreators: [],
};

describe("<CreatorCard />", () => {
  it("renders the creator name, handle, category, country, and description", () => {
    render(<CreatorCard creator={sample} />);
    expect(screen.getByText("Sample Creator")).toBeInTheDocument();
    expect(screen.getByText("@sample")).toBeInTheDocument();
    expect(screen.getByText("Entertainment")).toBeInTheDocument();
    expect(screen.getByText("USA")).toBeInTheDocument();
    expect(
      screen.getByText(/short summary of the creator/i),
    ).toBeInTheDocument();
  });

  it("wraps the card in a link to /creator/<slug>", () => {
    render(<CreatorCard creator={sample} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/creator/sample-creator");
  });

  it("exposes a slug via data attributes for E2E targeting", () => {
    render(<CreatorCard creator={sample} testId="popular-creator-sample" />);
    const link = screen.getByTestId("popular-creator-sample");
    expect(link).toHaveAttribute("data-creator-slug", "sample-creator");
  });
});
