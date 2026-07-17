import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ShareSection } from "../ShareSection";

const URL = "https://youtube-money-calculator.example/channel/UCXXXXXXXXXXXXXXXXXXXXXX";
const TITLE = "Some Channel";

describe("ShareSection", () => {
  beforeEach(() => {
    // Reset the clipboard mock and navigator.share detection between tests.
    // Reset in beforeEach so each test starts fresh.
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
    // navigator.share is not defined in jsdom by default; ensure it's absent.
    if ("share" in navigator) {
      // @ts-expect-error - delete for the fresh state
      delete (navigator as Navigator).share;
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the share heading and safe caption", () => {
    render(<ShareSection url={URL} channelTitle={TITLE} />);
    expect(
      screen.getByRole("heading", { name: /share this channel/i }),
    ).toBeInTheDocument();
    // The caption must explain estimates are not verified/official.
    // We check that positive claims of verification are absent while
    // the negation phrasing is present.
    const caption = screen.getByText(/estimates are independent/i);
    const text = caption.textContent?.toLowerCase() ?? "";
    expect(text).toMatch(/not (provided|verified)/);
    expect(text).not.toMatch(/officially provided|officially verified/);
  });

  it("does not render the native Web Share button when unsupported", () => {
    render(<ShareSection url={URL} channelTitle={TITLE} />);
    expect(
      screen.queryByRole("button", { name: /share .*via device sharing/i }),
    ).toBeNull();
  });

  it("renders the native Web Share button when supported and invokes navigator.share", async () => {
    const shareSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      value: shareSpy,
      configurable: true,
    });
    render(<ShareSection url={URL} channelTitle={TITLE} />);
    const btn = await screen.findByRole("button", {
      name: /share .*via device sharing/i,
    });
    await userEvent.click(btn);
    expect(shareSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: TITLE,
        text: expect.stringContaining("independent monthly earnings estimate"),
        url: URL,
      }),
    );
    // The share payload MUST NOT contain any dollar amount.
    const arg = shareSpy.mock.calls[0][0] as { text: string };
    expect(arg.text).not.toMatch(/\$|\d/);
  });

  it("copies the URL and announces success via ARIA live region", async () => {
    render(<ShareSection url={URL} channelTitle={TITLE} />);
    const copyBtn = screen.getByTestId("share-copy-link");
    await userEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(URL);
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        /link copied to your clipboard/i,
      ),
    );
  });

  it("shows a failure message when copying fails", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn().mockRejectedValue(new Error("denied")),
      },
      configurable: true,
    });
    // Also disable the execCommand fallback.
    const origExec = document.execCommand;
    document.execCommand = vi.fn(() => false);
    render(<ShareSection url={URL} channelTitle={TITLE} />);
    const copyBtn = screen.getByTestId("share-copy-link");
    await userEvent.click(copyBtn);
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/couldn.?t copy/i),
    );
    document.execCommand = origExec;
  });

  it("renders X, LinkedIn, and WhatsApp share links with noopener noreferrer", () => {
    render(<ShareSection url={URL} channelTitle={TITLE} />);
    const targets: [string, string][] = [
      ["share-x", "x.com/intent/tweet"],
      ["share-linkedin", "linkedin.com/sharing/share-offsite"],
      ["share-whatsapp", "api.whatsapp.com/send"],
    ];
    for (const [testId, host] of targets) {
      const link = screen.getByTestId(testId) as HTMLAnchorElement;
      expect(link.href).toContain(host);
      expect(link.target).toBe("_blank");
      expect(link.rel).toBe("noopener noreferrer");
    }
  });

  it("uses accessible labels that mention the channel title", () => {
    render(<ShareSection url={URL} channelTitle={TITLE} />);
    // Every action must have an accessible label naming the channel.
    for (const testId of [
      "share-copy-link",
      "share-x",
      "share-linkedin",
      "share-whatsapp",
    ]) {
      const el = screen.getByTestId(testId);
      const label = el.getAttribute("aria-label") || "";
      expect(label).toMatch(new RegExp(TITLE, "i"));
    }
  });
});
