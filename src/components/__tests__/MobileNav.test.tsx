import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { MobileNav } from "../MobileNav";

/**
 * MobileNav tests — App Store accordion navigation.
 *
 * The mobile drawer uses category accordions from the tool registry.
 * Only the first 8 tools per category are shown in the accordion.
 * Instagram Money Calculator is at position 12 in Creator Tools and
 * is intentionally NOT visible without scrolling/expanding further.
 */

describe("MobileNav — accordion navigation", () => {
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

    const nav = screen.getByRole("navigation", { name: /mobile navigation/i });

    expect(within(nav).getByRole("button", { name: /creator tools/i })).toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: /developer tools/i })).toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: /random & decision/i })).toBeInTheDocument();
  });

  it("expanding Creator Tools reveals tool links from the registry", async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    await user.click(screen.getByRole("button", { name: /open menu/i }));

    const nav = screen.getByRole("navigation", { name: /mobile navigation/i });

    // YouTube Money Calculator should NOT be visible before expanding
    expect(within(nav).queryByRole("link", { name: /youtube money calculator/i })).not.toBeInTheDocument();

    // Expand Creator Tools accordion
    await user.click(within(nav).getByRole("button", { name: /creator tools/i }));

    // Now the first 8 Creator Tools should be visible
    // YouTube Money Calculator is position 1 — should be visible
    expect(within(nav).getByRole("link", { name: /youtube money calculator/i })).toBeInTheDocument();
    // YouTube RPM Calculator is position 2 — should be visible
    expect(within(nav).getByRole("link", { name: /youtube rpm calculator/i })).toBeInTheDocument();
  });

  it("shows the Search tools button", async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    await user.click(screen.getByRole("button", { name: /open menu/i }));

    expect(screen.getByText(/search tools\.\.\./i)).toBeInTheDocument();
  });

  it("close icon button closes the dialog", async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    await user.click(screen.getByRole("button", { name: /open menu/i }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    // There are two close controls: backdrop (tabIndex=-1) and icon button.
    // Get all close buttons within the dialog and click the visible icon one.
    const closeButtons = within(dialog).getAllByRole("button", { name: /close menu/i });
    // The icon button is the one that is NOT the backdrop (backdrop has tabIndex=-1)
    const iconClose = closeButtons.find(
      (btn) => btn.getAttribute("tabindex") !== "-1",
    );
    expect(iconClose).toBeDefined();

    await user.click(iconClose!);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
