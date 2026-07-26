import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Header } from "../Header";

/**
 * Header navigation tests — updated for the App Store redesign.
 *
 * The new desktop navigation structure:
 *   Logo | Tools▼ | Creators▼ | Rankings | Blog | About▼ | [Search] | Language | Theme
 */

describe("Header — App Store navigation", () => {
  it("renders the BeHumler home link (Logo)", () => {
    render(<Header />);
    // Logo renders a link to "/" with the BeHumler brand
    const homeLink = screen.getByRole("link", { name: /behumler/i });
    expect(homeLink).toBeInTheDocument();
  });

  it("renders all top-level navigation items", () => {
    render(<Header />);
    expect(screen.getByRole("button", { name: /^tools$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^creators$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /rankings/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /blog/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^about$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /search tools/i })).toBeInTheDocument();
  });

  it("clicking Tools opens the mega menu with registry-driven content", async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByRole("button", { name: /^tools$/i }));

    // Mega menu should show category labels from the registry
    expect(screen.getByText(/creator tools/i)).toBeInTheDocument();
    expect(screen.getByText(/developer tools/i)).toBeInTheDocument();
    expect(screen.getByText(/popular tools/i)).toBeInTheDocument();
  });

  it("Tools mega menu contains expected tool links", async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByRole("button", { name: /^tools$/i }));

    // YouTube Money Calculator should appear in the mega menu
    expect(screen.getByRole("link", { name: /youtube money calculator/i })).toBeInTheDocument();
    // Instagram should also be available (inside Creator Tools category)
    expect(screen.getByRole("link", { name: /instagram money calculator/i })).toBeInTheDocument();
  });

  it("clicking Tools again closes the menu", async () => {
    const user = userEvent.setup();
    render(<Header />);

    // Open
    await user.click(screen.getByRole("button", { name: /^tools$/i }));
    expect(screen.getByText(/popular tools/i)).toBeInTheDocument();

    // Close
    await user.click(screen.getByRole("button", { name: /^tools$/i }));
    expect(screen.queryByText(/popular tools/i)).not.toBeInTheDocument();
  });

  it("Escape closes an open dropdown", async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByRole("button", { name: /^tools$/i }));
    expect(screen.getByText(/popular tools/i)).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByText(/popular tools/i)).not.toBeInTheDocument();
  });
});
