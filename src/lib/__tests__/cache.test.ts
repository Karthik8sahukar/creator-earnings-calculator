import { describe, expect, it } from "vitest";

import { TtlCache } from "../cache";

function makeTimeSource() {
  let t = 0;
  return {
    now: () => t,
    advance: (ms: number) => {
      t += ms;
    },
    set: (ms: number) => {
      t = ms;
    },
  };
}

describe("TtlCache", () => {
  it("stores and retrieves a value (cache hit)", () => {
    const cache = new TtlCache<string>({ maxSize: 10, ttlMs: 1000 });
    cache.set("a", "1");
    expect(cache.get("a")).toBe("1");
  });

  it("returns undefined for a miss", () => {
    const cache = new TtlCache<string>({ maxSize: 10, ttlMs: 1000 });
    expect(cache.get("nope")).toBeUndefined();
  });

  it("expires entries after TTL", () => {
    const time = makeTimeSource();
    const cache = new TtlCache<string>({ maxSize: 10, ttlMs: 100, now: time.now });
    cache.set("a", "1");
    expect(cache.get("a")).toBe("1");
    time.advance(150);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it("evicts least-recently-used entries when maxSize is exceeded", () => {
    const cache = new TtlCache<string>({ maxSize: 3, ttlMs: 10_000 });
    cache.set("a", "1");
    cache.set("b", "2");
    cache.set("c", "3");
    // Touch a to make it MRU
    cache.get("a");
    cache.set("d", "4");
    // b should have been evicted (LRU)
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")).toBe("1");
    expect(cache.get("c")).toBe("3");
    expect(cache.get("d")).toBe("4");
  });

  it("does not cache rejected loader promises", async () => {
    const cache = new TtlCache<string>({ maxSize: 3, ttlMs: 10_000 });
    let attempts = 0;
    const loader = async () => {
      attempts++;
      throw new Error("boom");
    };
    await expect(cache.getOrLoad("k", loader)).rejects.toThrow("boom");
    await expect(cache.getOrLoad("k", loader)).rejects.toThrow("boom");
    expect(attempts).toBe(2); // no caching of errors
  });

  it("deduplicates concurrent loads for the same key", async () => {
    const cache = new TtlCache<string>({ maxSize: 3, ttlMs: 10_000 });
    let calls = 0;
    const loader = () =>
      new Promise<string>((resolve) => {
        calls++;
        setTimeout(() => resolve("value"), 10);
      });

    const [a, b, c] = await Promise.all([
      cache.getOrLoad("k", loader),
      cache.getOrLoad("k", loader),
      cache.getOrLoad("k", loader),
    ]);
    expect(a).toBe("value");
    expect(b).toBe("value");
    expect(c).toBe("value");
    expect(calls).toBe(1);
  });

  it("caches loader success", async () => {
    const cache = new TtlCache<string>({ maxSize: 3, ttlMs: 10_000 });
    let calls = 0;
    const loader = async () => {
      calls++;
      return "hello";
    };
    expect(await cache.getOrLoad("k", loader)).toBe("hello");
    expect(await cache.getOrLoad("k", loader)).toBe("hello");
    expect(calls).toBe(1);
  });

  it("peek does not affect LRU ordering", () => {
    const cache = new TtlCache<string>({ maxSize: 2, ttlMs: 10_000 });
    cache.set("a", "1");
    cache.set("b", "2");
    cache.peek("a"); // should not touch LRU
    cache.set("c", "3");
    expect(cache.get("a")).toBeUndefined(); // a was evicted
  });

  it("delete removes an entry", () => {
    const cache = new TtlCache<string>({ maxSize: 3, ttlMs: 10_000 });
    cache.set("a", "1");
    expect(cache.delete("a")).toBe(true);
    expect(cache.get("a")).toBeUndefined();
  });

  it("clear wipes all entries", () => {
    const cache = new TtlCache<string>({ maxSize: 3, ttlMs: 10_000 });
    cache.set("a", "1");
    cache.set("b", "2");
    cache.clear();
    expect(cache.size).toBe(0);
  });

  it("rejects invalid options", () => {
    expect(() => new TtlCache({ maxSize: 0, ttlMs: 1000 })).toThrow();
    expect(() => new TtlCache({ maxSize: 1, ttlMs: 0 })).toThrow();
  });
});
