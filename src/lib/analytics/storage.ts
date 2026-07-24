/**
 * Analytics Storage Adapter — Interface + Implementations
 *
 * Provides a clean abstraction over snapshot storage so the UI and
 * service layer never access storage directly. Two implementations:
 *
 *   1. JsonFileAdapter — reads/writes to data/analytics/*.json
 *      Used in development, testing, and the snapshot script.
 *
 *   2. (Future) DatabaseAdapter — PostgreSQL/Vercel KV/Turso
 *      Swap in when the project adds a database dependency.
 *
 * The active adapter is selected by the factory function at the
 * bottom of this file.
 */

import type { CreatorSnapshot, SnapshotQuery, TimeRange } from "./types";

// ─── Storage Interface ──────────────────────────────────────────────

/**
 * The contract every storage adapter must fulfill.
 * UI components and service functions use only this interface.
 */
export interface AnalyticsStorage {
  /**
   * Append a snapshot. Returns true if stored, false if duplicate
   * (same creator + same time bucket already exists).
   */
  saveSnapshot(snapshot: CreatorSnapshot): Promise<boolean>;

  /**
   * Retrieve snapshots for a creator, filtered by time range.
   * Results are ordered by capturedAt ascending (oldest first).
   */
  getSnapshots(query: SnapshotQuery): Promise<CreatorSnapshot[]>;

  /**
   * Get the most recent snapshot for a creator (or null if none).
   */
  getLatestSnapshot(creatorSlug: string): Promise<CreatorSnapshot | null>;

  /**
   * Check whether a snapshot already exists for this creator in
   * the given time bucket (to prevent duplicates).
   */
  hasSnapshotInBucket(creatorSlug: string, bucketKey: string): Promise<boolean>;

  /**
   * Get all creators that have at least one snapshot.
   */
  getTrackedCreatorSlugs(): Promise<string[]>;
}

// ─── Time helpers ───────────────────────────────────────────────────

/**
 * Compute the start date for a given time range.
 */
export function rangeToStartDate(range: TimeRange): Date {
  const now = new Date();
  switch (range) {
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "1y":
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    case "all":
      return new Date(0); // Beginning of time
  }
}

/**
 * Generate a time-bucket key (YYYY-MM-DD) from a date.
 * Used to prevent duplicate snapshots within the same day.
 */
export function dateToBucketKey(date: Date): string {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

// ─── JSON File Adapter ──────────────────────────────────────────────

/**
 * Reads/writes snapshots to per-creator JSON files in data/analytics/.
 * File layout: data/analytics/{creatorSlug}.json
 *
 * This adapter is suitable for:
 *   - Local development
 *   - Testing (with fixtures)
 *   - Small deployments (< 1000 creators)
 *
 * For production Vercel deployments with 10K+ creators, swap to a
 * database adapter.
 */
export class JsonFileAdapter implements AnalyticsStorage {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  private filePath(slug: string): string {
    return `${this.basePath}/${slug}.json`;
  }

  private async readFile(slug: string): Promise<CreatorSnapshot[]> {
    // Dynamic import for Node.js fs — only runs server-side
    const fs = await import("node:fs");
    const path = this.filePath(slug);
    try {
      const content = fs.readFileSync(path, "utf-8");
      return JSON.parse(content) as CreatorSnapshot[];
    } catch {
      return [];
    }
  }

  private async writeFile(slug: string, snapshots: CreatorSnapshot[]): Promise<void> {
    const fs = await import("node:fs");
    const pathMod = await import("node:path");
    const dir = pathMod.dirname(this.filePath(slug));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      this.filePath(slug),
      JSON.stringify(snapshots, null, 2) + "\n",
      "utf-8",
    );
  }

  async saveSnapshot(snapshot: CreatorSnapshot): Promise<boolean> {
    const existing = await this.readFile(snapshot.creatorSlug);

    // Duplicate check: same day bucket
    const bucketKey = dateToBucketKey(new Date(snapshot.capturedAt));
    const hasDuplicate = existing.some(
      (s) => dateToBucketKey(new Date(s.capturedAt)) === bucketKey,
    );
    if (hasDuplicate) return false;

    // Append-only
    existing.push(snapshot);
    existing.sort(
      (a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime(),
    );
    await this.writeFile(snapshot.creatorSlug, existing);
    return true;
  }

  async getSnapshots(query: SnapshotQuery): Promise<CreatorSnapshot[]> {
    const all = await this.readFile(query.creatorSlug);
    const startDate = rangeToStartDate(query.range ?? "all");
    const startMs = startDate.getTime();

    let filtered = all.filter(
      (s) => new Date(s.capturedAt).getTime() >= startMs,
    );

    // Downsample if limit specified
    if (query.limit && filtered.length > query.limit) {
      const step = Math.ceil(filtered.length / query.limit);
      const downsampled: CreatorSnapshot[] = [];
      for (let i = 0; i < filtered.length; i += step) {
        downsampled.push(filtered[i]);
      }
      // Always include the last point
      if (downsampled[downsampled.length - 1] !== filtered[filtered.length - 1]) {
        downsampled.push(filtered[filtered.length - 1]);
      }
      filtered = downsampled;
    }

    return filtered;
  }

  async getLatestSnapshot(creatorSlug: string): Promise<CreatorSnapshot | null> {
    const all = await this.readFile(creatorSlug);
    if (all.length === 0) return null;
    return all[all.length - 1];
  }

  async hasSnapshotInBucket(creatorSlug: string, bucketKey: string): Promise<boolean> {
    const all = await this.readFile(creatorSlug);
    return all.some(
      (s) => dateToBucketKey(new Date(s.capturedAt)) === bucketKey,
    );
  }

  async getTrackedCreatorSlugs(): Promise<string[]> {
    const fs = await import("node:fs");
    try {
      const files = fs.readdirSync(this.basePath);
      return files
        .filter((f: string) => f.endsWith(".json"))
        .map((f: string) => f.replace(".json", ""));
    } catch {
      return [];
    }
  }
}

// ─── Empty Storage (Production fallback) ────────────────────────────

/**
 * A no-op storage adapter used in production when no database is
 * configured. Returns empty results for all queries — analytics
 * charts will show the "still collecting data" empty state.
 *
 * This prevents silent filesystem writes on Vercel's ephemeral FS.
 */
class EmptyStorage implements AnalyticsStorage {
  async saveSnapshot(): Promise<boolean> {
    return false;
  }
  async getSnapshots(): Promise<CreatorSnapshot[]> {
    return [];
  }
  async getLatestSnapshot(): Promise<CreatorSnapshot | null> {
    return null;
  }
  async hasSnapshotInBucket(): Promise<boolean> {
    return false;
  }
  async getTrackedCreatorSlugs(): Promise<string[]> {
    return [];
  }
}

// ─── Factory ────────────────────────────────────────────────────────

let _instance: AnalyticsStorage | null = null;

/**
 * Get the singleton storage adapter instance.
 *
 * Selection logic:
 *   - Test override via setAnalyticsStorage() → returns that
 *   - Development (NODE_ENV !== "production") → JsonFileAdapter
 *   - Production without database → EmptyStorage (safe no-op)
 *
 * The JsonFileAdapter is NEVER used during page rendering in
 * production because Vercel's filesystem is ephemeral. It only
 * runs in:
 *   - Local development
 *   - The analytics:snapshot script (CLI, not page render)
 *   - Unit/E2E tests
 */
export function getAnalyticsStorage(): AnalyticsStorage {
  if (!_instance) {
    if (process.env.NODE_ENV === "production") {
      // Production: no filesystem writes. When a database adapter
      // is added, instantiate it here instead.
      _instance = new EmptyStorage();
    } else {
      // Development / test: JSON files in data/analytics/
      const basePath = `${process.cwd()}/data/analytics`;
      _instance = new JsonFileAdapter(basePath);
    }
  }
  return _instance;
}

/**
 * Override the storage adapter (used in tests and scripts).
 */
export function setAnalyticsStorage(adapter: AnalyticsStorage): void {
  _instance = adapter;
}
