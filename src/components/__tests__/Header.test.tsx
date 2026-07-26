import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Header } from "../Header";

/**
 * Header navigation tests — App Store redesign.
 *
 * Desktop structure:
 *   Logo | Tools▼ | Creators▼ | Rankings | Blog | About▼ | [Search] | Language | Theme
 */

describe("Header — App Store navigation", () => {
  it("renders the BeHumler home link (Logo)", () => {
    render(<Header />);
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

    // Mega menu should show category labels and Popular Tools
    expect(screen.getByText(/creator tools/i)).toBeInTheDocument();
    expect(screen.getByText(/developer tools/i)).toBeInTheDocument();
    expect(screen.getByText(/popular tools/i)).toBeInTheDocument();
  });

  it("Tools mega menu contains expected tool links (scoped to avoid duplicates)", async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByRole("button", { name: /^tools$/i }));

    // Multiple links for the same tool may exist (category + popular sidebar).
    // Use getAllByRole and assert at least one exists.
    const youtubeLinks = screen.getAllByRole("link", {
      name: /youtube money calculator/i,
    });
    expect(youtubeLinks.length).toBeGreaterThan(0);

    const instagramLinks = screen.getAllByRole("link", {
      name: /instagram money calculator/i,
    });
    expect(instagramLinks.length).toBeGreaterThan(0);
  });

  it("clicking Tools again closes the menu", async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByRole("button", { name: /^tools$/i }));
    expect(screen.getByText(/popular tools/i)).toBeInTheDocument();

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
