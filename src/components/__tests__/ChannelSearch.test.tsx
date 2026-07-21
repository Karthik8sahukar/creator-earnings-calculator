import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ChannelSearch,
  _clientSearchCacheForTests,
} from "../ChannelSearch";

/**
 * Component tests for the debounced channel search combobox.
 * We stub `fetch` to control API responses deterministically.
 *
 * Timing contract (see `ChannelSearch.tsx`):
 *   - `MIN_SEARCH_CHARS` = 3 non-whitespace characters
 *   - `DEBOUNCE_MS`      = 700 ms
 * Tests advance timers by 800 ms whenever they need the debounce to fire.
 */

const DEBOUNCE_ADVANCE_MS = 800;

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

/** Wrap results in the current success envelope. */
function successEnvelope(results: unknown[]) {
  return { success: true, results };
}

/** Wrap an error into the current envelope. */
function errorEnvelope(code: string, message: string) {
  return { success: false, error: { code, message } };
}

beforeEach(() => {
  _clientSearchCacheForTests.clear();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  _clientSearchCacheForTests.clear();
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
    const fetchMock = mockFetch(successEnvelope(RESULTS));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={onSelect} />);
    await user.type(screen.getByRole("combobox"), "test");
    expect(fetchMock).not.toHaveBeenCalled();
    vi.advanceTimersByTime(DEBOUNCE_ADVANCE_MS);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it("does NOT fire one request per character — a full 'mr beast' typing session only triggers one upstream call", async () => {
    // Rapid typing: 8 characters, each within the debounce window.
    // Only the FINAL query "mr beast" (after the user stops) should
    // trigger a fetch. This is the single most important quota
    // guarantee of the component.
    const onSelect = vi.fn();
    const fetchMock = mockFetch(successEnvelope(RESULTS));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={onSelect} />);
    const input = screen.getByRole("combobox");
    for (const ch of "mr beast") {
      await user.type(input, ch);
      // Small pause between characters, WELL below the 700 ms debounce.
      vi.advanceTimersByTime(50);
    }
    expect(fetchMock).not.toHaveBeenCalled();
    vi.advanceTimersByTime(DEBOUNCE_ADVANCE_MS);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    // The single request must be for the FULL query, not any prefix.
    const firstCall = fetchMock.mock.calls[0] as unknown as [string];
    expect(firstCall[0]).toMatch(/q=mr(%20|\+)beast/);
  });

  it("does NOT fire a request below the 3-character minimum", async () => {
    const onSelect = vi.fn();
    const fetchMock = mockFetch(successEnvelope(RESULTS));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={onSelect} />);
    await user.type(screen.getByRole("combobox"), "mr");
    vi.advanceTimersByTime(DEBOUNCE_ADVANCE_MS);
    // Even after the debounce elapses, 2 chars is below the threshold.
    // Give it a full tick — nothing should have fired.
    await Promise.resolve();
    expect(fetchMock).not.toHaveBeenCalled();
    // Typing a 3rd char now allows the request.
    await user.type(screen.getByRole("combobox"), "b");
    vi.advanceTimersByTime(DEBOUNCE_ADVANCE_MS);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it("counts only non-whitespace characters against the 3-char minimum", async () => {
    // "  a  " has 5 characters but only ONE non-whitespace char.
    // The component must not fire a search on it.
    const onSelect = vi.fn();
    const fetchMock = mockFetch(successEnvelope(RESULTS));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={onSelect} />);
    await user.type(screen.getByRole("combobox"), "  a  ");
    vi.advanceTimersByTime(DEBOUNCE_ADVANCE_MS);
    await Promise.resolve();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("aborts a stale in-flight request when the user types a new query", async () => {
    // First fetch never resolves; second query should abort it and
    // start a fresh request that we can control.
    let secondResolve: (v: unknown) => void = () => {};
    const secondPending = new Promise((r) => {
      secondResolve = r;
    });

    const fetchMock = vi.fn().mockImplementation((_url, init) => {
      const attempt = fetchMock.mock.calls.length;
      if (attempt === 1) {
        return new Promise((_res, rej) => {
          const signal = (init as { signal?: AbortSignal }).signal;
          signal?.addEventListener("abort", () => {
            const err = new Error("aborted");
            err.name = "AbortError";
            rej(err);
          });
          // never resolves otherwise
        });
      }
      return (async () => {
        await secondPending;
        return {
          ok: true,
          status: 200,
          async json() {
            return successEnvelope(RESULTS);
          },
        };
      })();
    });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={vi.fn()} />);
    const input = screen.getByRole("combobox");

    // Kick off the first search
    await user.type(input, "alpha");
    vi.advanceTimersByTime(DEBOUNCE_ADVANCE_MS);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    // While the first request is in flight, the user retypes.
    await user.clear(input);
    await user.type(input, "beta 12");
    vi.advanceTimersByTime(DEBOUNCE_ADVANCE_MS);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    // The stale in-flight AbortController must have fired abort.
    const firstInit = fetchMock.mock.calls[0][1] as { signal: AbortSignal };
    expect(firstInit.signal.aborted).toBe(true);

    // Resolve the second (current) request; the user should see the
    // fresh results, not a stale error.
    secondResolve(true);
    await waitFor(() =>
      expect(screen.getByText("Alpha Channel")).toBeInTheDocument(),
    );
    // The aborted first request must NOT surface as an error state.
    expect(screen.queryByText(/aborted/i)).toBeNull();
  });

  it("deduplicates identical in-flight requests: the same normalized query fires only once", async () => {
    // Slow-resolve fetch so we can trigger dedup while the first
    // request is still pending.
    let resolve: (v: unknown) => void = () => {};
    const pending = new Promise((r) => {
      resolve = r;
    });
    const fetchMock = vi.fn(async () => {
      await pending;
      return {
        ok: true,
        status: 200,
        async json() {
          return successEnvelope(RESULTS);
        },
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={vi.fn()} />);
    const input = screen.getByRole("combobox");

    await user.type(input, "mr beast");
    vi.advanceTimersByTime(DEBOUNCE_ADVANCE_MS);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    // The user types trailing whitespace then removes it — the
    // normalized query stays "mr beast". No new request should fire.
    await user.type(input, "   ");
    vi.advanceTimersByTime(DEBOUNCE_ADVANCE_MS);
    await user.keyboard("{Backspace}{Backspace}{Backspace}");
    vi.advanceTimersByTime(DEBOUNCE_ADVANCE_MS);

    // Still only one fetch — the second request was deduped.
    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolve(true);
  });

  it("serves a repeated identical query from the client cache with NO fetch", async () => {
    const onSelect = vi.fn();
    const fetchMock = mockFetch(successEnvelope(RESULTS));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={onSelect} />);
    const input = screen.getByRole("combobox");

    await user.type(input, "mrbeast");
    vi.advanceTimersByTime(DEBOUNCE_ADVANCE_MS);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByText("Alpha Channel")).toBeInTheDocument(),
    );

    // Clear and retype the exact same normalized query.
    await user.clear(input);
    // Below MIN_SEARCH_CHARS while clearing, so no fetch scheduled.
    await user.type(input, "MrBeast");
    vi.advanceTimersByTime(DEBOUNCE_ADVANCE_MS);
    await waitFor(() =>
      expect(screen.getByText("Alpha Channel")).toBeInTheDocument(),
    );
    // Only the ORIGINAL fetch ever happened — the case-insensitive
    // client cache serves the second attempt.
    expect(fetchMock).toHaveBeenCalledTimes(1);
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
        return {
          ok: true,
          status: 200,
          async json() {
            return successEnvelope(RESULTS);
          },
        };
      }),
    );
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={onSelect} />);
    await user.type(screen.getByRole("combobox"), "test");
    vi.advanceTimersByTime(DEBOUNCE_ADVANCE_MS);
    // While pending, the combobox must be expanded and skeletons visible
    await waitFor(() =>
      expect(screen.getByRole("combobox")).toHaveAttribute("aria-expanded", "true"),
    );
    resolveRequest({});
  });

  it("renders each search result", async () => {
    const onSelect = vi.fn();
    mockFetch(successEnvelope(RESULTS));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={onSelect} />);
    await user.type(screen.getByRole("combobox"), "test");
    vi.advanceTimersByTime(DEBOUNCE_ADVANCE_MS);
    await waitFor(() => {
      expect(screen.getByText("Alpha Channel")).toBeInTheDocument();
      expect(screen.getByText("Beta Channel")).toBeInTheDocument();
    });
  });

  it("shows an empty message when the API returns no results", async () => {
    const onSelect = vi.fn();
    mockFetch(successEnvelope([]));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={onSelect} />);
    await user.type(screen.getByRole("combobox"), "nothingxyz");
    vi.advanceTimersByTime(DEBOUNCE_ADVANCE_MS);
    await waitFor(() =>
      expect(screen.getByText(/no channels found/i)).toBeInTheDocument(),
    );
  });

  it("shows the mapped 'quota' message when the server returns QUOTA_EXCEEDED", async () => {
    const onSelect = vi.fn();
    mockFetch(
      errorEnvelope(
        "QUOTA_EXCEEDED",
        "The YouTube API quota has been exceeded. Please try again later.",
      ),
      false,
      429,
    );
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={onSelect} />);
    await user.type(screen.getByRole("combobox"), "test");
    vi.advanceTimersByTime(DEBOUNCE_ADVANCE_MS);
    await waitFor(() =>
      expect(screen.getByText(/quota has been exceeded/i)).toBeInTheDocument(),
    );
  });

  it("shows the mapped 'missing YouTube API configuration' message for MISSING_API_KEY", async () => {
    const onSelect = vi.fn();
    mockFetch(
      errorEnvelope(
        "MISSING_API_KEY",
        "The server is missing its YouTube API configuration.",
      ),
      false,
      500,
    );
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={onSelect} />);
    await user.type(screen.getByRole("combobox"), "test");
    vi.advanceTimersByTime(DEBOUNCE_ADVANCE_MS);
    await waitFor(() =>
      expect(
        screen.getByText(/missing its YouTube API configuration/i),
      ).toBeInTheDocument(),
    );
  });

  it("shows the mapped 'temporarily unavailable' message for UPSTREAM_UNAVAILABLE", async () => {
    const onSelect = vi.fn();
    mockFetch(
      errorEnvelope("UPSTREAM_UNAVAILABLE", "Down"),
      false,
      502,
    );
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={onSelect} />);
    await user.type(screen.getByRole("combobox"), "test");
    vi.advanceTimersByTime(DEBOUNCE_ADVANCE_MS);
    await waitFor(() =>
      expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument(),
    );
  });

  it("shows the mapped 'temporarily unavailable' message for YOUTUBE_API_ERROR (never the old 'unexpected response' copy)", async () => {
    const onSelect = vi.fn();
    mockFetch(
      errorEnvelope("YOUTUBE_API_ERROR", "server-side detail"),
      false,
      502,
    );
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={onSelect} />);
    await user.type(screen.getByRole("combobox"), "test");
    vi.advanceTimersByTime(DEBOUNCE_ADVANCE_MS);
    await waitFor(() =>
      expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument(),
    );
    expect(
      screen.queryByText(/returned an unexpected response/i),
    ).toBeNull();
  });

  it("treats a 200 response with success=false as an error", async () => {
    const onSelect = vi.fn();
    // Some upstream / edge middleware quirks can return HTTP 200 with a
    // body of { success: false, error: { … } }. The client must still
    // treat this as an error path.
    mockFetch(errorEnvelope("YOUTUBE_API_ERROR", "test"), true, 200);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={onSelect} />);
    await user.type(screen.getByRole("combobox"), "test");
    vi.advanceTimersByTime(DEBOUNCE_ADVANCE_MS);
    await waitFor(() =>
      expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument(),
    );
  });

  it("falls back gracefully when the server responds with non-JSON", async () => {
    const onSelect = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 502,
        async json() {
          throw new SyntaxError("Unexpected token < in JSON");
        },
      })),
    );
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={onSelect} />);
    await user.type(screen.getByRole("combobox"), "test");
    vi.advanceTimersByTime(DEBOUNCE_ADVANCE_MS);
    // We should surface some user-facing error message; the specific
    // wording is a fallback but must never be a raw JSON parse error.
    await waitFor(() =>
      expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument(),
    );
  });

  it("does NOT auto-select the first result", async () => {
    const onSelect = vi.fn();
    mockFetch(successEnvelope(RESULTS));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={onSelect} />);
    await user.type(screen.getByRole("combobox"), "test");
    vi.advanceTimersByTime(DEBOUNCE_ADVANCE_MS);
    await waitFor(() => screen.getByText("Alpha Channel"));
    expect(onSelect).not.toHaveBeenCalled();
    // aria-activedescendant should NOT point at option 0 initially
    expect(screen.getByRole("combobox")).not.toHaveAttribute(
      "aria-activedescendant",
    );
  });

  it("Arrow keys navigate and Enter selects", async () => {
    const onSelect = vi.fn();
    mockFetch(successEnvelope(RESULTS));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={onSelect} />);
    const input = screen.getByRole("combobox");
    await user.type(input, "test");
    vi.advanceTimersByTime(DEBOUNCE_ADVANCE_MS);
    await waitFor(() => screen.getByText("Alpha Channel"));

    await user.keyboard("{ArrowDown}"); // -> item 0
    await user.keyboard("{ArrowDown}"); // -> item 1
    await user.keyboard("{ArrowUp}");   // -> back to item 0
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("UC_aaaaaaaaaaaaaaaaaaaaaa");
  });

  it("Escape closes the dropdown", async () => {
    const onSelect = vi.fn();
    mockFetch(successEnvelope(RESULTS));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={onSelect} />);
    const input = screen.getByRole("combobox");
    await user.type(input, "test");
    vi.advanceTimersByTime(DEBOUNCE_ADVANCE_MS);
    await waitFor(() => screen.getByText("Alpha Channel"));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(input).toHaveAttribute("aria-expanded", "false"));
  });

  it("clicking a result calls onSelect", async () => {
    const onSelect = vi.fn();
    mockFetch(successEnvelope(RESULTS));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChannelSearch onSelect={onSelect} />);
    await user.type(screen.getByRole("combobox"), "test");
    vi.advanceTimersByTime(DEBOUNCE_ADVANCE_MS);
    await waitFor(() => screen.getByText("Beta Channel"));
    await user.click(screen.getByText("Beta Channel"));
    expect(onSelect).toHaveBeenCalledWith("UC_bbbbbbbbbbbbbbbbbbbbbb");
  });
});
