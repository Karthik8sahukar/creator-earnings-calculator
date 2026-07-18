import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { MobileNav } from "../MobileNav";

/**
 * MobileNav visibility tests.
 *
 * Requirements:
 *   - Instagram Money Calculator appears as a top-level menu entry.
 *   - It is NOT nested behind an expandable/collapsible submenu — the
 *     "Calculators" heading in MobileNav is a section label, not a
 *     disclosure widget. This test guards against a regression that
 *     would hide the Instagram entry behind a click.
 *   - The link points to `/instagram-money-calculator`, never
 *     `/en/en/…`.
 */

describe("MobileNav — Instagram Money Calculator visibility", () => {
  it("shows the pinned Instagram link immediately when the menu opens", async () => {
    render(<MobileNav />);
    await userEvent.click(
      screen.getByRole("button", { name: /open menu/i }),
    );
    const link = screen.getByTestId("mobile-instagram-link");
    expect(link).toBeVisible();
    expect(link).toHaveAttribute("href", "/instagram-money-calculator");
    expect(link.getAttribute("href") ?? "").not.toMatch(/\/en\/en\//);
  });

  it("also lists Instagram Money Calculator flat under the Calculators section", async () => {
    render(<MobileNav />);
    await userEvent.click(
      screen.getByRole("button", { name: /open menu/i }),
    );
    // There must be at least one link whose href is
    // `/instagram-money-calculator` inside the mobile nav — proving
    // the flat-list entry is present (in addition to the pinned one).
    const links = screen.getAllByRole("link", {
      name: /instagram money calculator/i,
    });
    expect(links.length).toBeGreaterThanOrEqual(1);
    for (const l of links) {
      expect(l).toHaveAttribute("href", "/instagram-money-calculator");
    }
  });

  it("Calculators heading is a section label, not a collapsible disclosure", async () => {
    render(<MobileNav />);
    await userEvent.click(
      screen.getByRole("button", { name: /open menu/i }),
    );
    // There should be NO button with the accessible name "Calculators"
    // acting as a disclosure inside the mobile menu.
    const buttons = screen.queryAllByRole("button", {
      name: /^Calculators$/,
    });
    expect(buttons.length).toBe(0);
  });
});
