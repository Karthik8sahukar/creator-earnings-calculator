import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EarningsCalculator } from "../EarningsCalculator";
import type { PerformanceAnalysis } from "@/types/youtube";

const ANALYSIS: PerformanceAnalysis = {
  averageRecentViews: 100_000,
  medianRecentViews: 90_000,
  uploadsLast30Days: 4,
  uploadsLast90Days: 12,
  recentObservedViews: 1_200_000,
  estimatedMonthlyViews: 400_000,
  shortsPercentage: 20,
  longFormPercentage: 80,
  monthlyViewEstimate: { low: 280_000, expected: 400_000, high: 540_000 },
  sampleSize: 12,
};

function readState() {
  const node = screen.getByTestId("calculator-state-json");
  return JSON.parse(node.textContent || "{}") as {
    state: Record<string, unknown>;
    params: string;
  };
}

function readMonthlyText(): string {
  return screen.getByTestId("earnings-monthly").textContent ?? "";
}

/** Parse the visible headline back to a plain number for comparison. */
function readMonthlyNumber(): number {
  return Number(readMonthlyText().replace(/[^\d.]/g, ""));
}

beforeEach(() => {
  // navigation.mediaMatch is already stubbed in vitest.setup.ts
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { origin: "http://localhost:3000", pathname: "/", href: "http://localhost:3000/" },
  });
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("EarningsCalculator — defaults", () => {
  it("seeds monthly views from the analysis expected value", () => {
    render(<EarningsCalculator analysis={ANALYSIS} />);
    expect(readState().state.monthlyViews).toBe(400_000);
  });

  it("picks 'long' content type when shorts <= 30%", () => {
    render(<EarningsCalculator analysis={ANALYSIS} />);
    expect(readState().state.contentType).toBe("long");
  });

  it("picks 'mixed' content type between 30% and 70%", () => {
    render(<EarningsCalculator analysis={{ ...ANALYSIS, shortsPercentage: 50, longFormPercentage: 50 }} />);
    expect(readState().state.contentType).toBe("mixed");
  });

  it("picks 'shorts' content type at 70% or higher", () => {
    render(<EarningsCalculator analysis={{ ...ANALYSIS, shortsPercentage: 80, longFormPercentage: 20 }} />);
    expect(readState().state.contentType).toBe("shorts");
  });
});

describe("EarningsCalculator — scenario selection", () => {
  it("selects Expected on initial render with no user interaction", () => {
    render(<EarningsCalculator analysis={ANALYSIS} />);
    expect(readState().state.estimateBand).toBe("expected");
    const expectedTab = screen.getByTestId("estimate-tab-expected");
    expect(expectedTab).toHaveAttribute("aria-selected", "true");
    // Low and High should not be selected.
    expect(screen.getByTestId("estimate-tab-low")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    expect(screen.getByTestId("estimate-tab-high")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("shows the Expected earnings result immediately (no click required)", () => {
    render(<EarningsCalculator analysis={ANALYSIS} />);
    const monthly = readMonthlyText();
    // Should be a real, non-zero currency amount reflecting the
    // auto-estimated monthly views for the Expected band.
    expect(monthly).toMatch(/^\$\d/);
    expect(monthly).not.toMatch(/^\$0\.00/);
  });

  it("auto-estimated channel views populate the Expected result via a URL-partial seed", () => {
    // Simulates ChannelDashboard's flow: URL had no calculator params,
    // so `initialState` is an empty partial. The calculator must still
    // seed monthly views from analysis and produce a non-zero result.
    render(<EarningsCalculator analysis={ANALYSIS} initialState={{}} />);
    expect(readState().state.monthlyViews).toBe(
      ANALYSIS.monthlyViewEstimate.expected,
    );
    expect(readState().state.estimateBand).toBe("expected");
    expect(readMonthlyText()).toMatch(/^\$\d/);
    expect(readMonthlyText()).not.toMatch(/^\$0\.00/);
  });

  it("even when the URL provides other keys, missing scenario defaults to Expected", () => {
    render(
      <EarningsCalculator
        analysis={ANALYSIS}
        initialState={{ country: "GB", monetizedPercentage: 60 }}
      />,
    );
    expect(readState().state.estimateBand).toBe("expected");
    expect(screen.getByTestId("estimate-tab-expected")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    // And the Expected calculation is visible immediately.
    expect(readMonthlyText()).toMatch(/^\$\d/);
    expect(readMonthlyText()).not.toMatch(/^\$0\.00/);
  });

  it("preserves the scenario when the URL provides it (eb=high)", () => {
    render(
      <EarningsCalculator
        analysis={ANALYSIS}
        initialState={{ estimateBand: "high" }}
      />,
    );
    expect(readState().state.estimateBand).toBe("high");
    expect(screen.getByTestId("estimate-tab-high")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    // And the seeded monthlyViews should reflect the high band.
    expect(readState().state.monthlyViews).toBe(
      ANALYSIS.monthlyViewEstimate.high,
    );
  });

  it("switching to Low changes the earnings result", async () => {
    const user = userEvent.setup();
    render(<EarningsCalculator analysis={ANALYSIS} />);
    const beforeMonthly = readMonthlyNumber();
    await user.click(screen.getByTestId("estimate-tab-low"));
    expect(readState().state.estimateBand).toBe("low");
    expect(readState().state.monthlyViews).toBe(
      ANALYSIS.monthlyViewEstimate.low,
    );
    // A non-empty positive change is enough — the numeric direction
    // (lower) is enforced by calculateEarnings' unit tests.
    const afterMonthly = readMonthlyNumber();
    expect(afterMonthly).toBeGreaterThan(0);
    expect(afterMonthly).not.toBe(beforeMonthly);
  });

  it("switching to High changes the earnings result", async () => {
    const user = userEvent.setup();
    render(<EarningsCalculator analysis={ANALYSIS} />);
    const beforeMonthly = readMonthlyNumber();
    await user.click(screen.getByTestId("estimate-tab-high"));
    expect(readState().state.estimateBand).toBe("high");
    expect(readState().state.monthlyViews).toBe(
      ANALYSIS.monthlyViewEstimate.high,
    );
    const afterMonthly = readMonthlyNumber();
    expect(afterMonthly).toBeGreaterThan(0);
    expect(afterMonthly).not.toBe(beforeMonthly);
  });

  it("Reset returns the scenario to Expected", async () => {
    const user = userEvent.setup();
    render(
      <EarningsCalculator
        analysis={ANALYSIS}
        initialState={{ estimateBand: "high" }}
      />,
    );
    expect(readState().state.estimateBand).toBe("high");
    await user.click(screen.getByRole("button", { name: /reset/i }));
    expect(readState().state.estimateBand).toBe("expected");
    expect(screen.getByTestId("estimate-tab-expected")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    // And the Expected result is visible immediately after reset.
    expect(readMonthlyText()).toMatch(/^\$\d/);
    expect(readMonthlyText()).not.toMatch(/^\$0\.00/);
  });
});

describe("EarningsCalculator — user interactions", () => {
  it("updates monthly views when the user types", async () => {
    const user = userEvent.setup();
    render(<EarningsCalculator analysis={ANALYSIS} />);
    const input = screen.getByLabelText("Monthly views");
    await user.clear(input);
    await user.type(input, "1000000");
    expect(readState().state.monthlyViews).toBe(1_000_000);
  });

  it("changing the country updates state", async () => {
    const user = userEvent.setup();
    render(<EarningsCalculator analysis={ANALYSIS} />);
    await user.selectOptions(screen.getByLabelText("Country / audience"), "GB");
    expect(readState().state.country).toBe("GB");
  });

  it("changing the niche updates state", async () => {
    const user = userEvent.setup();
    render(<EarningsCalculator analysis={ANALYSIS} />);
    await user.selectOptions(screen.getByLabelText("Niche"), "tech");
    expect(readState().state.niche).toBe("tech");
  });

  it("changing the content type updates state", async () => {
    const user = userEvent.setup();
    render(<EarningsCalculator analysis={ANALYSIS} />);
    await user.selectOptions(screen.getByLabelText("Content type"), "shorts");
    expect(readState().state.contentType).toBe("shorts");
  });

  it("switching RPM to custom enables the custom-RPM field", async () => {
    const user = userEvent.setup();
    render(<EarningsCalculator analysis={ANALYSIS} />);
    const rpmField = screen.getByLabelText("Custom RPM (USD)");
    expect(rpmField).toBeDisabled();
    await user.selectOptions(screen.getByLabelText("RPM mode"), "custom");
    expect(rpmField).not.toBeDisabled();
    await user.clear(rpmField);
    await user.type(rpmField, "8");
    expect(readState().state.customRpm).toBe(8);
  });

  it("changing currency updates state", async () => {
    const user = userEvent.setup();
    render(<EarningsCalculator analysis={ANALYSIS} />);
    await user.selectOptions(screen.getByLabelText("Display currency"), "EUR");
    expect(readState().state.currency).toBe("EUR");
  });

  it("editing additional income updates state", async () => {
    const user = userEvent.setup();
    render(<EarningsCalculator analysis={ANALYSIS} />);
    const sponsor = screen.getByLabelText("Sponsorships");
    await user.clear(sponsor);
    await user.type(sponsor, "500");
    expect(readState().state.sponsorship).toBe(500);
  });

  it("invalid text in a number field falls back to 0", async () => {
    const user = userEvent.setup();
    render(<EarningsCalculator analysis={ANALYSIS} />);
    const sponsor = screen.getByLabelText("Sponsorships");
    await user.clear(sponsor);
    expect(readState().state.sponsorship).toBe(0);
  });

  it("Reset restores defaults", async () => {
    const user = userEvent.setup();
    render(<EarningsCalculator analysis={ANALYSIS} />);
    await user.selectOptions(screen.getByLabelText("Country / audience"), "GB");
    expect(readState().state.country).toBe("GB");
    await user.click(screen.getByRole("button", { name: /reset/i }));
    // After reset, country should be the default (US)
    expect(readState().state.country).toBe("US");
  });

  it("formats the headline monthly value with the selected currency", async () => {
    const user = userEvent.setup();
    render(<EarningsCalculator analysis={ANALYSIS} />);
    // Default currency is USD → the headline should start with $
    const monthly = screen.getByTestId("earnings-monthly");
    expect(monthly.textContent).toMatch(/^\$/);
    await user.selectOptions(screen.getByLabelText("Display currency"), "EUR");
    expect(monthly.textContent).toMatch(/€/);
  });

  it("initial state can be seeded from URL-shaped params", () => {
    render(
      <EarningsCalculator
        analysis={ANALYSIS}
        initialState={{ country: "IN", monetizedPercentage: 60 }}
      />,
    );
    expect(readState().state.country).toBe("IN");
    expect(readState().state.monetizedPercentage).toBe(60);
  });

  it("Copy share link button is present", () => {
    render(<EarningsCalculator analysis={ANALYSIS} />);
    const btn = screen.getByRole("button", { name: /copy share link/i });
    expect(btn).toBeInTheDocument();
  });

  it("headline reflects a real currency amount when monthly views is set", () => {
    render(<EarningsCalculator analysis={ANALYSIS} />);
    const monthly = screen.getByTestId("earnings-monthly");
    // Not zero (we seeded 400,000 monthly views)
    expect(monthly.textContent).not.toMatch(/\$0\.00$/);
  });

  it("earnings estimator section has an accessible heading", () => {
    render(<EarningsCalculator analysis={ANALYSIS} />);
    const region = screen.getByRole("region", { name: /earnings estimator/i });
    expect(within(region).getByRole("heading", { level: 2 })).toBeInTheDocument();
  });
});
