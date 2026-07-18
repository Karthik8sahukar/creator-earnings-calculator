import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PopularCalculators } from "../PopularCalculators";

/**
 * Popular Calculators section tests.
 *
 * The Instagram Money Calculator must render as a visible card on
 * the homepage with the exact description that markets its
 * monetization streams. The full card is a single Link (no nested
 * interactive elements) and the "Open" CTA is always visible — not
 * hover-only — so touch users can see the affordance.
 */

describe("PopularCalculators — Instagram visibility", () => {
  it("renders the Instagram Money Calculator card visibly", () => {
    render(<PopularCalculators />);
    const card = screen.getByTestId("popular-card-instagram-money-calculator");
    expect(card).toBeVisible();
    // Full-card clickable link with a bare, locale-neutral href.
    expect(card).toHaveAttribute("href", "/instagram-money-calculator");
    expect(card.getAttribute("href") ?? "").not.toMatch(/\/en\/en\//);
  });

  it("card content mentions the required monetization streams", () => {
    render(<PopularCalculators />);
    const card = screen.getByTestId("popular-card-instagram-money-calculator");
    const text = card.textContent ?? "";
    // Spec description mentions sponsored posts, Reels, Stories,
    // affiliate income.
    expect(text).toMatch(/sponsored posts/i);
    expect(text).toMatch(/Reels/);
    expect(text).toMatch(/Stories/);
    expect(text).toMatch(/affiliate/i);
  });

  it("card exposes an always-visible Open CTA", () => {
    render(<PopularCalculators />);
    const card = screen.getByTestId("popular-card-instagram-money-calculator");
    expect(within(card).getByText(/^Open$/)).toBeVisible();
  });

  it("does not nest a button inside the card link (no nested interactive elements)", () => {
    render(<PopularCalculators />);
    const card = screen.getByTestId("popular-card-instagram-money-calculator");
    expect(within(card).queryByRole("button")).toBeNull();
  });

  it("renders the Instagram card near the top (after Money Calculator)", () => {
    render(<PopularCalculators />);
    const links = screen.getAllByRole("link");
    const idxMoney = links.findIndex((l) => l.textContent?.includes("Money Calculator") && !l.textContent?.includes("Instagram"));
    const idxInstagram = links.findIndex((l) =>
      l.getAttribute("data-testid") === "popular-card-instagram-money-calculator",
    );
    expect(idxInstagram).toBeGreaterThan(idxMoney);
  });

  it("does not emit raw translation keys in the card content", () => {
    render(<PopularCalculators />);
    const card = screen.getByTestId("popular-card-instagram-money-calculator");
    // A raw next-intl key looks like `foo.bar.baz` — assert no such
    // token appears in the rendered card.
    expect(card.textContent ?? "").not.toMatch(
      /popularCalculators\.[a-zA-Z]+\.[a-zA-Z]+/,
    );
  });
});
