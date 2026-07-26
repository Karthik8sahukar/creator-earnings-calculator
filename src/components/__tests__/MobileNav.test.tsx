import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { MobileNav } from "../MobileNav";

/**
 * MobileNav tests — updated for the App Store redesign.
 *
 * The new mobile navigation uses category accordions populated from
 * the tool registry. Tools are NOT directly visible — users must
 * expand the relevant category accordion first.
 */

describe("MobileNav — App Store accordion navigation", () => {
  it("opens the drawer when clicking the menu button", async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    await user.click(screen.getByRole("button", { name: /open menu/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /mobile navigation/i })).toBeInTheDocument();
  });

  it("shows category accordion buttons", async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    await user.click(screen.getByRole("button", { name: /open menu/i }));

    // Category accordions should be visible (from TOOL_CATEGORIES)
    expect(screen.getByRole("button", { name: /creator tools/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /developer tools/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /random & decision/i })).toBeInTheDocument();
  });

  it("expanding Creator Tools reveals tool links including Instagram", async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    await user.click(screen.getByRole("button", { name: /open menu/i }));

    // Instagram should NOT be visible before expanding
    expect(screen.queryByRole("link", { name: /instagram money calculator/i })).not.toBeInTheDocument();

    // Expand Creator Tools accordion
    await user.click(screen.getByRole("button", { name: /creator tools/i }));

    // Now Instagram and YouTube should be visible
    expect(screen.getByRole("link", { name: /youtube money calculator/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /instagram money calculator/i })).toBeInTheDocument();
  });

  it("shows the Search tools button", async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    await user.click(screen.getByRole("button", { name: /open menu/i }));

    expect(screen.getByText(/search tools\.\.\./i)).toBeInTheDocument();
  });

  it("close button closes the dialog", async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    await user.click(screen.getByRole("button", { name: /open menu/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /close menu/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
