import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Header } from "../Header";

/**
 * Header visibility tests.
 *
 * The Instagram Money Calculator must be directly reachable from the
 * top navigation without opening the Calculators dropdown. These
 * tests fail if the visible header link is removed or if its href
 * regresses to `/en/en/…`.
 */

describe("Header — Instagram Money Calculator visibility", () => {
  it("renders a visible direct link to /instagram-money-calculator", () => {
    render(<Header />);
    const link = screen.getByTestId("header-instagram-link");
    expect(link).toBeInTheDocument();
    // `@/i18n/navigation` Link is aliased to next/link in tests, so the
    // href attribute is the raw path (no locale prefix). The important
    // property is that it is a BARE path — production locale prefixing
    // works via next-intl's routing helpers.
    expect(link).toHaveAttribute("href", "/instagram-money-calculator");
    // Must never emit a duplicated `/en/en/…` even under adversarial
    // configuration — the raw href stays a bare path.
    expect(link.getAttribute("href") ?? "").not.toMatch(/\/en\/en\//);
  });

  it("uses descriptive accessible label", () => {
    render(<Header />);
    const link = screen.getByTestId("header-instagram-link");
    // aria-label maps to the full "Instagram Money Calculator" name.
    expect(link.getAttribute("aria-label") ?? "").toMatch(/Instagram/);
  });

  it("keeps the Calculators dropdown trigger present alongside the direct link", () => {
    render(<Header />);
    // The dropdown trigger remains — this test guards against
    // accidentally REPLACING the dropdown with just the direct link.
    const dropdownTrigger = screen.getByRole("button", { name: /calculators/i });
    expect(dropdownTrigger).toBeInTheDocument();
  });
});
