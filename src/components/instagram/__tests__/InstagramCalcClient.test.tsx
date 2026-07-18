import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { InstagramCalcClient } from "../InstagramCalcClient";

/**
 * Component tests for the Instagram Money Calculator client shell.
 *
 * These exercise the interactive surface without needing Playwright,
 * and cover the wire-up between form state, results, share URL
 * writes, and the reset / advanced flows.
 *
 * The Recharts canvas is lazy-loaded and rendered inside an
 * async `next/dynamic()` module — we let it fall back to the
 * skeleton, which is fine for these unit tests. The
 * screen-reader summary is rendered synchronously by the wrapper.
 */

let history: string[] = [];
let currentSearch = "";

beforeEach(() => {
  history = [];
  currentSearch = "";
  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      origin: "http://localhost:3000",
      pathname: "/en/instagram-money-calculator",
      href: "http://localhost:3000/en/instagram-money-calculator",
      get search() {
        return currentSearch;
      },
    },
  });
  vi.spyOn(window.history, "replaceState").mockImplementation((_s, _t, url) => {
    if (typeof url === "string") {
      history.push(url);
      const q = url.split("?")[1] ?? "";
      currentSearch = q ? `?${q}` : "";
    }
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("InstagramCalcClient", () => {
  it("renders the form and results sections with the default state", async () => {
    render(<InstagramCalcClient />);
    expect(screen.getByTestId("instagram-calculator-form")).toBeInTheDocument();
    expect(
      screen.getByTestId("instagram-calculator-results"),
    ).toBeInTheDocument();
    // Bands row is present.
    const bandRow = screen.getByTestId("ig-band-row");
    expect(bandRow).toBeInTheDocument();
    // Default state produces a currency amount somewhere in results.
    expect(bandRow.textContent ?? "").toMatch(/\$/);
  });

  it("updates the URL when inputs change", async () => {
    render(<InstagramCalcClient />);
    const followers = screen.getByTestId("ig-followers") as HTMLInputElement;
    await userEvent.clear(followers);
    await userEvent.type(followers, "500000");
    await waitFor(
      () => {
        expect(history.some((u) => u.includes("followers=500000"))).toBe(true);
      },
      { timeout: 1000 },
    );
  });

  it("toggling advanced settings reveals the advanced fieldset", async () => {
    render(<InstagramCalcClient />);
    const toggle = screen.getByTestId("ig-advanced-toggle");
    expect(document.getElementById("ig-advanced")).toBeNull();
    await userEvent.click(toggle);
    expect(document.getElementById("ig-advanced")).not.toBeNull();
    await userEvent.click(toggle);
    expect(document.getElementById("ig-advanced")).toBeNull();
  });

  it("changing the currency updates the visible amount format", async () => {
    render(<InstagramCalcClient />);
    const currency = screen.getByTestId("ig-currency") as HTMLSelectElement;
    await userEvent.selectOptions(currency, "INR");
    // INR formats with the ₹ symbol via Intl.NumberFormat.
    await waitFor(() => {
      expect(screen.getByTestId("ig-band-row").textContent ?? "").toMatch(
        /₹/,
      );
    });
  });

  it("switching niche changes the expected monthly headline", async () => {
    render(<InstagramCalcClient />);
    const before = screen.getByTestId("ig-band-row").textContent ?? "";
    const niche = screen.getByTestId("ig-niche") as HTMLSelectElement;
    await userEvent.selectOptions(niche, "finance");
    await waitFor(() => {
      expect(screen.getByTestId("ig-band-row").textContent ?? "").not.toBe(
        before,
      );
    });
  });

  it("copy-share button is present and clickable", async () => {
    // Mock clipboard writeText so the button doesn't throw.
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<InstagramCalcClient />);
    const copyBtn = screen.getByTestId("ig-copy-share");
    await userEvent.click(copyBtn);
    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
    });
  });

  it("copy-results button copies the results text", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<InstagramCalcClient />);
    const copyBtn = screen.getByTestId("ig-copy-results");
    await userEvent.click(copyBtn);
    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
    });
    const [[written]] = writeText.mock.calls;
    expect(String(written)).toMatch(/monthly earnings/i);
  });
});
