import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProfileCard } from "../ProfileCard";
import type { ChannelDetails } from "@/types/youtube";

const BASE: ChannelDetails = {
  channelId: "UC_xxxxxxxxxxxxxxxxxxxxxx",
  title: "Test Creator",
  handle: "@testcreator",
  description: "A description of the channel.",
  thumbnail: "https://cdn.example/thumb.png",
  bannerUrl: null,
  subscriberCount: 1_234_567,
  hiddenSubscriberCount: false,
  viewCount: 42_000_000,
  videoCount: 320,
  publishedAt: "2018-01-15T00:00:00Z",
  country: "US",
  uploadsPlaylistId: "UU_xxxxxxxxxxxxxxxxxxxxxx",
  channelUrl: "https://www.youtube.com/@testcreator",
  customUrl: "@testcreator",
};

describe("ProfileCard", () => {
  it("renders the channel title and handle", () => {
    render(<ProfileCard channel={BASE} />);
    expect(screen.getByRole("heading", { name: "Test Creator" })).toBeInTheDocument();
    expect(screen.getByText("@testcreator")).toBeInTheDocument();
  });

  it("shows the profile thumbnail with alt text", () => {
    render(<ProfileCard channel={BASE} />);
    const img = screen.getByAltText(/test creator profile picture/i);
    expect(img).toBeInTheDocument();
  });

  it("shows a compact subscriber count", () => {
    render(<ProfileCard channel={BASE} />);
    // 1,234,567 -> ~1.2M
    expect(screen.getByText(/1\.2M/)).toBeInTheDocument();
  });

  it("labels hidden subscribers explicitly", () => {
    render(
      <ProfileCard
        channel={{ ...BASE, subscriberCount: null, hiddenSubscriberCount: true }}
      />,
    );
    expect(screen.getByText(/hidden/i)).toBeInTheDocument();
  });

  it("shows total views and video count", () => {
    render(<ProfileCard channel={BASE} />);
    // 42M and 320
    expect(screen.getByText(/42M/)).toBeInTheDocument();
    expect(screen.getByText("320")).toBeInTheDocument();
  });

  it("shows the country", () => {
    render(<ProfileCard channel={BASE} />);
    expect(screen.getByText("US")).toBeInTheDocument();
  });

  it("shows a formatted joined date", () => {
    render(<ProfileCard channel={BASE} />);
    // The published date is 2018-01-15, so the year should appear.
    expect(screen.getByText(/2018/)).toBeInTheDocument();
  });

  it("View on YouTube link is safe (opens new tab with noopener)", () => {
    render(<ProfileCard channel={BASE} />);
    const link = screen.getByRole("link", { name: /view test creator on youtube/i });
    expect(link).toHaveAttribute("href", BASE.channelUrl);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel") ?? "").toMatch(/noopener/);
    expect(link.getAttribute("rel") ?? "").toMatch(/noreferrer/);
  });
});
