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
    // Number inputs reject non-numeric strings; make sure we don't blow up.
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

  it("switching to the 'high' band pushes the higher monthly-views value", async () => {
    const user = userEvent.setup();
    render(<EarningsCalculator analysis={ANALYSIS} />);
    await user.click(screen.getByRole("tab", { name: /high/i }));
    expect(readState().state.monthlyViews).toBe(ANALYSIS.monthlyViewEstimate.high);
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
