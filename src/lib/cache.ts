/**
 * Bounded, in-memory TTL cache with concurrent-request deduplication.
 *
 * Design goals:
 *   - Configurable per-namespace TTL and max size
 *   - Automatic expiry (checked lazily on read + on insert)
 *   - No caching of rejected promises → errors don't stick
 *   - Concurrent calls for the same key share a single in-flight promise
 *   - Zero external dependencies
 *
 * IMPORTANT: This cache is process-local. In serverless / multi-instance
 * deployments each replica has its own cache. For a globally-consistent
 * cache, swap the storage for Redis. The `getOrLoad` contract does not
 * change — only the internal storage does.
 */

export interface CacheOptions {
  /** Max entry count before least-recently-used entries are evicted. */
  maxSize: number;
  /** Time to live for a fresh entry, in milliseconds. */
  ttlMs: number;
  /** Optional "now" injector for deterministic tests. */
  now?: () => number;
}

interface Entry<V> {
  value: V;
  expiresAt: number;
}

export class TtlCache<V> {
  private readonly store = new Map<string, Entry<V>>();
  private readonly inflight = new Map<string, Promise<V>>();
  private readonly maxSize: number;
  private readonly ttlMs: number;
  private readonly now: () => number;

  constructor(opts: CacheOptions) {
    if (opts.maxSize <= 0) throw new Error("maxSize must be > 0");
    if (opts.ttlMs <= 0) throw new Error("ttlMs must be > 0");
    this.maxSize = opts.maxSize;
    this.ttlMs = opts.ttlMs;
    this.now = opts.now ?? Date.now;
  }

  get size(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
    this.inflight.clear();
  }

  /** Peek without touching LRU order. Returns undefined if missing/expired. */
  peek(key: string): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  /** Get + refresh recency. Returns undefined if missing/expired. */
  get(key: string): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.now()) {
      this.store.delete(key);
      return undefined;
    }
    // touch → move to end (most recently used)
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(key: string, value: V): void {
    if (this.store.has(key)) {
      this.store.delete(key);
    }
    this.store.set(key, { value, expiresAt: this.now() + this.ttlMs });
    // evict LRU
    while (this.store.size > this.maxSize) {
      const oldest = this.store.keys().next().value;
      if (oldest === undefined) break;
      this.store.delete(oldest);
    }
  }

  /** Explicitly delete an entry. */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Get or load with a single-flight guarantee: concurrent calls with the
   * same key share the same underlying loader promise. Rejected promises
   * are NEVER cached.
   */
  async getOrLoad(key: string, loader: () => Promise<V>): Promise<V> {
    const cached = this.get(key);
    if (cached !== undefined) return cached;

    const existing = this.inflight.get(key);
    if (existing) return existing;

    const promise = (async () => {
      try {
        const result = await loader();
        this.set(key, result);
        return result;
      } finally {
        this.inflight.delete(key);
      }
    })();

    this.inflight.set(key, promise);
    return promise;
  }
}

/**
 * Global cache instances for the YouTube service. Sized generously enough
 * to matter for real traffic but small enough to stay bounded in RAM.
 *
 * TTLs:
 *   - Search results   : 45 minutes  (queries are noisy, small TTL is fine)
 *   - Channel details  : 6 hours     (stats update slowly)
 *   - Recent videos    : 2 hours     (new uploads matter but not hot-path)
 */
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export const searchCache = new TtlCache<unknown>({
  maxSize: 500,
  ttlMs: 45 * MINUTE,
});

export const channelCache = new TtlCache<unknown>({
  maxSize: 500,
  ttlMs: 6 * HOUR,
});

export const videosCache = new TtlCache<unknown>({
  maxSize: 500,
  ttlMs: 2 * HOUR,
});
