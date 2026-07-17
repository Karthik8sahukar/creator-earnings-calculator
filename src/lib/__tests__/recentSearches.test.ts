import { beforeEach, describe, expect, it } from "vitest";

import {
  RECENT_MAX,
  addRecent,
  clearRecent,
  loadRecent,
  saveRecent,
  type RecentChannel,
} from "../recentSearches";

function makeEntry(
  id: string,
  overrides: Partial<Omit<RecentChannel, "channelId" | "at">> = {},
  at = Date.now(),
): RecentChannel {
  return {
    channelId: id,
    title: overrides.title ?? "Test",
    handle: overrides.handle ?? "@test",
    thumbnail: overrides.thumbnail ?? "",
    at,
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("addRecent", () => {
  it("prepends a new channel", () => {
    const next = addRecent([], {
      channelId: "UC_aaaaaaaaaaaaaaaaaaaaaa",
      title: "A",
      handle: "@a",
      thumbnail: "",
    });
    expect(next[0].channelId).toBe("UC_aaaaaaaaaaaaaaaaaaaaaa");
  });

  it("deduplicates by channelId", () => {
    const initial = [
      makeEntry("UC_aaaaaaaaaaaaaaaaaaaaaa", { title: "A" }),
      makeEntry("UC_bbbbbbbbbbbbbbbbbbbbbb", { title: "B" }),
    ];
    const next = addRecent(initial, {
      channelId: "UC_aaaaaaaaaaaaaaaaaaaaaa",
      title: "A",
      handle: "@a",
      thumbnail: "",
    });
    expect(next.filter((r) => r.channelId === "UC_aaaaaaaaaaaaaaaaaaaaaa"))
      .toHaveLength(1);
    expect(next[0].channelId).toBe("UC_aaaaaaaaaaaaaaaaaaaaaa");
  });

  it("caps the list at RECENT_MAX", () => {
    let list: RecentChannel[] = [];
    // Generate uniquely-suffixed channel ids so dedup doesn't kick in.
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    for (let i = 0; i < RECENT_MAX + 5; i++) {
      const suffix = alphabet[i % alphabet.length].repeat(2) + String(i).padStart(19, "a");
      list = addRecent(list, {
        channelId: `UC${suffix}`,
        title: `T${i}`,
        handle: null,
        thumbnail: "",
      });
    }
    expect(list).toHaveLength(RECENT_MAX);
  });

  it("rejects invalid channel ids", () => {
    const next = addRecent([], {
      channelId: "not-a-real-id",
      title: "X",
      handle: null,
      thumbnail: "",
    });
    expect(next).toEqual([]);
  });
});

describe("localStorage round-trip", () => {
  it("saves and loads a list", () => {
    const list = [
      makeEntry("UC_aaaaaaaaaaaaaaaaaaaaaa", { title: "A" }, 2000),
      makeEntry("UC_bbbbbbbbbbbbbbbbbbbbbb", { title: "B" }, 1000),
    ];
    saveRecent(list);
    const loaded = loadRecent();
    expect(loaded).toHaveLength(2);
    // Most recent first
    expect(loaded[0].channelId).toBe("UC_aaaaaaaaaaaaaaaaaaaaaa");
  });

  it("returns [] when storage is empty", () => {
    expect(loadRecent()).toEqual([]);
  });

  it("ignores malformed entries", () => {
    window.localStorage.setItem(
      "cec.recent-channels.v1",
      JSON.stringify([{ notAChannel: true }, "junk"]),
    );
    expect(loadRecent()).toEqual([]);
  });

  it("survives non-JSON payloads", () => {
    window.localStorage.setItem("cec.recent-channels.v1", "not-json");
    expect(loadRecent()).toEqual([]);
  });

  it("clearRecent wipes the list", () => {
    saveRecent([makeEntry("UC_aaaaaaaaaaaaaaaaaaaaaa")]);
    clearRecent();
    expect(loadRecent()).toEqual([]);
  });
});
