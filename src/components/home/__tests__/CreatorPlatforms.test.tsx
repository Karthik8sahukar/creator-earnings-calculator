import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CreatorPlatforms } from "../CreatorPlatforms";

/**
 * CreatorPlatforms section tests.
 *
 * Requirements:
 *   • Two prominent, always-visible platform cards (YouTube +
 *     Instagram) rendered directly on the homepage — no carousel,
 *     no tabs.
 *   • The full card is a single Link.
 *   • The Instagram card mentions every monetization stream from the
 *     spec: Sponsored posts, Reels, Stories, Affiliate revenue,
 *     Subscriptions.
 *   • Each card exposes a descriptive CTA.
 *   • No raw translation keys leak into the DOM.
 */

describe("CreatorPlatforms", () => {
  it("renders the section heading and subtitle", () => {
    render(<CreatorPlatforms />);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /Creator earnings calculators/i,
      }),
    ).toBeVisible();
    expect(
      screen.getByText(
        /Estimate creator income across YouTube and Instagram/i,
      ),
    ).toBeVisible();
  });

  it("renders both platform cards without a carousel or tabs", () => {
    render(<CreatorPlatforms />);
    expect(screen.getByTestId("platform-card-youtube")).toBeVisible();
    expect(screen.getByTestId("platform-card-instagram")).toBeVisible();
    // No tablist / tabpanel / carousel roles anywhere in this section.
    const section = screen.getByTestId("creator-platforms");
    expect(within(section).queryByRole("tablist")).toBeNull();
    expect(within(section).queryByRole("tabpanel")).toBeNull();
  });

  it("Instagram card lists sponsored posts, Reels, Stories, affiliate revenue and subscriptions", () => {
    render(<CreatorPlatforms />);
    const card = screen.getByTestId("platform-card-instagram");
    const text = card.textContent ?? "";
    expect(text).toMatch(/Sponsored posts/i);
    expect(text).toMatch(/Reels/);
    expect(text).toMatch(/Stories/);
    expect(text).toMatch(/Affiliate revenue/i);
    expect(text).toMatch(/Subscriptions/i);
  });

  it("Instagram card is a full-card Link with a bare, locale-neutral href", () => {
    render(<CreatorPlatforms />);
    const card = screen.getByTestId("platform-card-instagram");
    // It's rendered as an <a> because @/i18n/navigation Link is
    // aliased to next/link in tests.
    expect(card.tagName).toBe("A");
    expect(card).toHaveAttribute("href", "/instagram-money-calculator");
    expect(card.getAttribute("href") ?? "").not.toMatch(/\/en\/en\//);
    // No nested interactive elements.
    expect(within(card).queryByRole("button")).toBeNull();
  });

  it("YouTube card links to the channel-search anchor on the homepage", () => {
    render(<CreatorPlatforms />);
    const card = screen.getByTestId("platform-card-youtube");
    expect(card).toHaveAttribute("href", "/#find-channel");
    expect(card.getAttribute("href") ?? "").not.toMatch(/\/en\/en\//);
  });

  it("each card exposes a descriptive CTA", () => {
    render(<CreatorPlatforms />);
    const instagram = screen.getByTestId("platform-card-instagram");
    expect(within(instagram).getByText(/Open Instagram calculator/i)).toBeVisible();
    const youtube = screen.getByTestId("platform-card-youtube");
    expect(within(youtube).getByText(/Open YouTube calculator/i)).toBeVisible();
  });

  it("does not emit raw translation keys", () => {
    render(<CreatorPlatforms />);
    const section = screen.getByTestId("creator-platforms");
    expect(section.textContent ?? "").not.toMatch(
      /creatorPlatforms\.[a-zA-Z]+\.[a-zA-Z]+/,
    );
  });
});
