import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Footer } from "../Footer";

/**
 * Footer visibility tests.
 *
 * Instagram Money Calculator must appear in the footer's Calculators
 * column, immediately below YouTube Money Calculator.
 */

describe("Footer — Instagram Money Calculator visibility", () => {
  it("includes a direct footer link to /instagram-money-calculator", () => {
    render(<Footer />);
    const link = screen.getByTestId("footer-instagram-link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/instagram-money-calculator");
    expect(link.getAttribute("href") ?? "").not.toMatch(/\/en\/en\//);
  });

  it("Instagram appears second in the Calculators list (after YouTube Money)", () => {
    render(<Footer />);
    // Find the "Calculators" heading, then get the list that follows.
    const heading = screen.getByRole("heading", {
      name: /^Calculators$/,
      level: 4,
    });
    // The <h4> and <ul> are siblings; grab the parent then the ul.
    const parent = heading.parentElement as HTMLElement;
    const list = within(parent).getByRole("list");
    const items = within(list).getAllByRole("listitem");
    // First item = YouTube Money Calculator (labelled "Money Calculator").
    expect(items[0].textContent).toMatch(/Money Calculator/);
    // Second item = Instagram Money Calculator.
    expect(items[1].textContent).toMatch(/Instagram Money Calculator/);
  });
});
