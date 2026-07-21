import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ChannelSearch } from "../ChannelSearch";

/**
 * Component tests for the explicit-submission channel search.
 *
 * Key invariants tested:
 *   - Typing does NOT call /api/search or YouTube
 *   - Clicking "Search Channel" submits once
 *   - Pressing Enter submits once
 *   - Repeated clicks while pending do not create duplicate requests
 *   - No suggestion list appears while typing
 *   - Invalid plain text is rejected only after submission
 */

const RESULTS = [
  {
    channelId: "UC_aaaaaaaaaaaaaaaaaaaaaa",
    title: "Alpha Channel",
    handle: "@alpha",
    description: "First result",
    thumbnail: "",
    subscriberCount: 1000,
    hiddenSubscriberCount: false,
  },
];

function mockFetch(body: unknown, ok = true, status = 200) {
  const fetchMock = vi.fn(async () => ({
    ok,
    status,
    async json() {
      return body;
    },
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function mockFetchPending() {
  let resolveRequest: (v: unknown) => void = () => {};
  const pending = new Promise((r) => {
    resolveRequest = r;
  });
  const fetchMock = vi.fn(async () => {
    await pending;
    return { ok: true, status: 200, async json() { return { results: RESULTS }; } };
  });
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, resolveRequest };
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("ChannelSearch — explicit submission", () => {
  it("renders an input and a Search Channel button", () => {
    render(<ChannelSearch onSelect={vi.fn()} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /search channel/i }),
    ).toBeInTheDocument();
  });

  it("renders the helper text", () => {
    render(<ChannelSearch onSelect={vi.fn()} />);
    expect(
      screen.getByText(/then click search/i),
    ).toBeInTheDocument();
  });

  it("typing does NOT call /api/search", async () => {
    const fetchMock = mockFetch({ results: RESULTS });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={vi.fn()} />);

    const input = screen.getByRole("textbox");
    await user.type(input, "@MrBeast");

    // Wait well past any hypothetical debounce
    vi.advanceTimersByTime(2000);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("typing does NOT show any suggestions or dropdown", async () => {
    mockFetch({ results: RESULTS });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={vi.fn()} />);

    await user.type(screen.getByRole("textbox"), "@MrBeast");
    vi.advanceTimersByTime(2000);

    // No listbox, no options, no suggestions
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
    expect(screen.queryByText("Alpha Channel")).not.toBeInTheDocument();
  });

  it("clicking Search Channel submits once", async () => {
    const fetchMock = mockFetch({ results: RESULTS });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={vi.fn()} />);

    await user.type(screen.getByRole("textbox"), "@MrBeast");
    await user.click(screen.getByRole("button", { name: /search channel/i }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/search?q=%40MrBeast"),
      expect.any(Object),
    );
  });

  it("pressing Enter submits once", async () => {
    const fetchMock = mockFetch({ results: RESULTS });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={vi.fn()} />);

    const input = screen.getByRole("textbox");
    await user.type(input, "@MrBeast");
    await user.keyboard("{Enter}");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("repeated clicks while pending do NOT create duplicate requests", async () => {
    const { fetchMock } = mockFetchPending();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={vi.fn()} />);

    await user.type(screen.getByRole("textbox"), "@MrBeast");

    const btn = screen.getByRole("button", { name: /search channel/i });
    await user.click(btn);

    // Button should now be disabled
    expect(btn).toBeDisabled();

    // Attempt additional clicks — they should be blocked
    await user.click(btn);
    await user.click(btn);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows 'Searching...' on the button while loading", async () => {
    mockFetchPending();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={vi.fn()} />);

    await user.type(screen.getByRole("textbox"), "@MrBeast");
    await user.click(screen.getByRole("button", { name: /search channel/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /searching/i })).toBeInTheDocument(),
    );
  });

  it("invalid plain text is rejected only AFTER submission", async () => {
    mockFetch(
      { error: "UNSUPPORTED_INPUT", message: "Enter a valid YouTube @handle, channel URL, or channel ID." },
      false,
      400,
    );
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={vi.fn()} />);

    const input = screen.getByRole("textbox");
    await user.type(input, "MrBeast");

    // While typing: no validation message yet
    expect(screen.queryByText(/enter a valid/i)).not.toBeInTheDocument();

    // Submit
    await user.click(screen.getByRole("button", { name: /search channel/i }));

    // Now the validation message appears
    await waitFor(() =>
      expect(screen.getByText(/enter a valid youtube/i)).toBeInTheDocument(),
    );
  });

  it("displays channel results after successful submission", async () => {
    mockFetch({ results: RESULTS });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={vi.fn()} />);

    await user.type(screen.getByRole("textbox"), "@alpha");
    await user.click(screen.getByRole("button", { name: /search channel/i }));

    await waitFor(() =>
      expect(screen.getByText("Alpha Channel")).toBeInTheDocument(),
    );
  });

  it("clicking a result calls onSelect", async () => {
    mockFetch({ results: RESULTS });
    const onSelect = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={onSelect} />);

    await user.type(screen.getByRole("textbox"), "@alpha");
    await user.click(screen.getByRole("button", { name: /search channel/i }));

    await waitFor(() => screen.getByText("Alpha Channel"));
    await user.click(screen.getByText("Alpha Channel"));

    expect(onSelect).toHaveBeenCalledWith("UC_aaaaaaaaaaaaaaaaaaaaaa");
  });

  it("shows empty message when no channels found", async () => {
    mockFetch({ results: [] });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={vi.fn()} />);

    await user.type(screen.getByRole("textbox"), "@nonexistent");
    await user.click(screen.getByRole("button", { name: /search channel/i }));

    await waitFor(() =>
      expect(screen.getByText(/no channels found/i)).toBeInTheDocument(),
    );
  });

  it("shows error message on API failure", async () => {
    mockFetch({ message: "Quota exceeded" }, false, 429);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={vi.fn()} />);

    await user.type(screen.getByRole("textbox"), "@test");
    await user.click(screen.getByRole("button", { name: /search channel/i }));

    await waitFor(() =>
      expect(screen.getByText(/quota exceeded/i)).toBeInTheDocument(),
    );
  });

  it("button is disabled when input is empty", () => {
    render(<ChannelSearch onSelect={vi.fn()} />);
    const btn = screen.getByRole("button", { name: /search channel/i });
    expect(btn).toBeDisabled();
  });

  it("does NOT have combobox role or listbox elements", () => {
    render(<ChannelSearch onSelect={vi.fn()} />);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("no aria-autocomplete attribute exists", () => {
    render(<ChannelSearch onSelect={vi.fn()} />);
    const input = screen.getByRole("textbox");
    expect(input).not.toHaveAttribute("aria-autocomplete");
  });
});
