import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ChannelSearch } from "../ChannelSearch";

/**
 * Component tests for the debounced channel search combobox.
 * We stub `fetch` to control API responses deterministically.
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
  {
    channelId: "UC_bbbbbbbbbbbbbbbbbbbbbb",
    title: "Beta Channel",
    handle: "@beta",
    description: "Second result",
    thumbnail: "",
    subscriberCount: 2000,
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

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("ChannelSearch", () => {
  it("renders the input with the expected placeholder", () => {
    const onSelect = vi.fn();
    render(<ChannelSearch onSelect={onSelect} />);
    const input = screen.getByRole("combobox");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute(
      "placeholder",
      expect.stringContaining("channel"),
    );
  });

  it("does not fire a fetch until the user stops typing (debounce)", async () => {
    const onSelect = vi.fn();
    const fetchMock = mockFetch({ results: RESULTS });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={onSelect} />);
    await user.type(screen.getByRole("combobox"), "test");
    expect(fetchMock).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it("shows a loading skeleton while the request is in flight", async () => {
    const onSelect = vi.fn();
    let resolveRequest: (v: unknown) => void = () => {};
    const pending = new Promise((r) => {
      resolveRequest = r;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        await pending;
        return { ok: true, status: 200, async json() { return { results: RESULTS }; } };
      }),
    );
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={onSelect} />);
    await user.type(screen.getByRole("combobox"), "test");
    vi.advanceTimersByTime(500);
    // While pending, the combobox must be expanded and skeletons visible
    await waitFor(() =>
      expect(screen.getByRole("combobox")).toHaveAttribute("aria-expanded", "true"),
    );
    resolveRequest({});
  });

  it("renders each search result", async () => {
    const onSelect = vi.fn();
    mockFetch({ results: RESULTS });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={onSelect} />);
    await user.type(screen.getByRole("combobox"), "test");
    vi.advanceTimersByTime(500);
    await waitFor(() => {
      expect(screen.getByText("Alpha Channel")).toBeInTheDocument();
      expect(screen.getByText("Beta Channel")).toBeInTheDocument();
    });
  });

  it("shows an empty message when the API returns no results", async () => {
    const onSelect = vi.fn();
    mockFetch({ results: [] });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={onSelect} />);
    await user.type(screen.getByRole("combobox"), "nothingxyz");
    vi.advanceTimersByTime(500);
    await waitFor(() =>
      expect(screen.getByText(/no channels found/i)).toBeInTheDocument(),
    );
  });

  it("shows an error message on API failure", async () => {
    const onSelect = vi.fn();
    mockFetch({ message: "Quota exceeded" }, false, 429);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={onSelect} />);
    await user.type(screen.getByRole("combobox"), "test");
    vi.advanceTimersByTime(500);
    await waitFor(() =>
      expect(screen.getByText(/quota exceeded/i)).toBeInTheDocument(),
    );
  });

  it("does NOT auto-select the first result", async () => {
    const onSelect = vi.fn();
    mockFetch({ results: RESULTS });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={onSelect} />);
    await user.type(screen.getByRole("combobox"), "test");
    vi.advanceTimersByTime(500);
    await waitFor(() => screen.getByText("Alpha Channel"));
    expect(onSelect).not.toHaveBeenCalled();
    // aria-activedescendant should NOT point at option 0 initially
    expect(screen.getByRole("combobox")).not.toHaveAttribute(
      "aria-activedescendant",
    );
  });

  it("Arrow keys navigate and Enter selects", async () => {
    const onSelect = vi.fn();
    mockFetch({ results: RESULTS });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={onSelect} />);
    const input = screen.getByRole("combobox");
    await user.type(input, "test");
    vi.advanceTimersByTime(500);
    await waitFor(() => screen.getByText("Alpha Channel"));

    await user.keyboard("{ArrowDown}"); // -> item 0
    await user.keyboard("{ArrowDown}"); // -> item 1
    await user.keyboard("{ArrowUp}");   // -> back to item 0
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("UC_aaaaaaaaaaaaaaaaaaaaaa");
  });

  it("Escape closes the dropdown", async () => {
    const onSelect = vi.fn();
    mockFetch({ results: RESULTS });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={onSelect} />);
    const input = screen.getByRole("combobox");
    await user.type(input, "test");
    vi.advanceTimersByTime(500);
    await waitFor(() => screen.getByText("Alpha Channel"));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(input).toHaveAttribute("aria-expanded", "false"));
  });

  it("clicking a result calls onSelect", async () => {
    const onSelect = vi.fn();
    mockFetch({ results: RESULTS });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={onSelect} />);
    await user.type(screen.getByRole("combobox"), "test");
    vi.advanceTimersByTime(500);
    await waitFor(() => screen.getByText("Beta Channel"));
    await user.click(screen.getByText("Beta Channel"));
    expect(onSelect).toHaveBeenCalledWith("UC_bbbbbbbbbbbbbbbbbbbbbb");
  });
});
