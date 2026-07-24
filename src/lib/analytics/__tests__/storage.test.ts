/**
 * Unit tests for the analytics storage adapter.
 *
 * Uses an in-memory implementation to test the contract
 * without touching the filesystem.
 */

import { describe, expect, it, beforeEach } from "vitest";
import type { CreatorSnapshot, SnapshotQuery } from "../types";
import { dateToBucketKey, type AnalyticsStorage } from "../storage";

// ─── In-memory adapter for testing ──────────────────────────────────

class InMemoryAdapter implements AnalyticsStorage {
  private store = new Map<string, CreatorSnapshot[]>();

  async saveSnapshot(snapshot: CreatorSnapshot): Promise<boolean> {
    const existing = this.store.get(snapshot.creatorSlug) ?? [];
    const bucketKey = dateToBucketKey(new Date(snapshot.capturedAt));
    const hasDuplicate = existing.some(
      (s) => dateToBucketKey(new Date(s.capturedAt)) === bucketKey,
    );
    if (hasDuplicate) return false;
    existing.push(snapshot);
    existing.sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
    this.store.set(snapshot.creatorSlug, existing);
    return true;
  }

  async getSnapshots(query: SnapshotQuery): Promise<CreatorSnapshot[]> {
    return this.store.get(query.creatorSlug) ?? [];
  }

  async getLatestSnapshot(slug: string): Promise<CreatorSnapshot | null> {
    const all = this.store.get(slug) ?? [];
    return all[all.length - 1] ?? null;
  }

  async hasSnapshotInBucket(slug: string, bucketKey: string): Promise<boolean> {
    const all = this.store.get(slug) ?? [];
    return all.some((s) => dateToBucketKey(new Date(s.capturedAt)) === bucketKey);
  }

  async getTrackedCreatorSlugs(): Promise<string[]> {
    return Array.from(this.store.keys());
  }
}

// ─── Helpers ────────────────────────────────────────────────────────

function makeSnapshot(slug: string, capturedAt: string): CreatorSnapshot {
  return {
    id: `snap-${slug}-${capturedAt}`,
    creatorSlug: slug,
    capturedAt,
    subscribers: 1_000_000,
    totalViews: 100_000_000,
    videoCount: 500,
    estimatedDailyEarningsUsd: 100,
    estimatedMonthlyEarningsUsd: 3000,
    estimatedYearlyEarningsUsd: 36000,
    estimatedRpmUsd: 4.0,
    estimatedCpmUsd: 7.2,
    source: "fixture",
    dataQuality: "high",
  };
}

// ─── Tests ──────────────────────────────────────────────────────────

describe("AnalyticsStorage (in-memory adapter)", () => {
  let storage: InMemoryAdapter;

  beforeEach(() => {
    storage = new InMemoryAdapter();
  });

  it("saves a snapshot and retrieves it", async () => {
    const snapshot = makeSnapshot("mrbeast", "2026-07-01T12:00:00.000Z");
    const saved = await storage.saveSnapshot(snapshot);
    expect(saved).toBe(true);

    const snapshots = await storage.getSnapshots({ creatorSlug: "mrbeast" });
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].id).toBe(snapshot.id);
  });

  it("prevents duplicate snapshots in the same day bucket", async () => {
    const snap1 = makeSnapshot("mrbeast", "2026-07-01T08:00:00.000Z");
    const snap2 = makeSnapshot("mrbeast", "2026-07-01T20:00:00.000Z");

    const first = await storage.saveSnapshot(snap1);
    const second = await storage.saveSnapshot(snap2);

    expect(first).toBe(true);
    expect(second).toBe(false); // Same day bucket

    const snapshots = await storage.getSnapshots({ creatorSlug: "mrbeast" });
    expect(snapshots).toHaveLength(1);
  });

  it("allows snapshots on different days", async () => {
    const snap1 = makeSnapshot("mrbeast", "2026-07-01T12:00:00.000Z");
    const snap2 = makeSnapshot("mrbeast", "2026-07-02T12:00:00.000Z");

    await storage.saveSnapshot(snap1);
    await storage.saveSnapshot(snap2);

    const snapshots = await storage.getSnapshots({ creatorSlug: "mrbeast" });
    expect(snapshots).toHaveLength(2);
  });

  it("stores snapshots in chronological order", async () => {
    const snap3 = makeSnapshot("mrbeast", "2026-07-03T12:00:00.000Z");
    const snap1 = makeSnapshot("mrbeast", "2026-07-01T12:00:00.000Z");
    const snap2 = makeSnapshot("mrbeast", "2026-07-02T12:00:00.000Z");

    await storage.saveSnapshot(snap3);
    await storage.saveSnapshot(snap1);
    await storage.saveSnapshot(snap2);

    const snapshots = await storage.getSnapshots({ creatorSlug: "mrbeast" });
    expect(snapshots[0].capturedAt).toBe("2026-07-01T12:00:00.000Z");
    expect(snapshots[2].capturedAt).toBe("2026-07-03T12:00:00.000Z");
  });

  it("isolates creators from each other", async () => {
    await storage.saveSnapshot(makeSnapshot("mrbeast", "2026-07-01T12:00:00.000Z"));
    await storage.saveSnapshot(makeSnapshot("pewdiepie", "2026-07-01T12:00:00.000Z"));

    const mrbeast = await storage.getSnapshots({ creatorSlug: "mrbeast" });
    const pewdiepie = await storage.getSnapshots({ creatorSlug: "pewdiepie" });

    expect(mrbeast).toHaveLength(1);
    expect(pewdiepie).toHaveLength(1);
    expect(mrbeast[0].creatorSlug).toBe("mrbeast");
    expect(pewdiepie[0].creatorSlug).toBe("pewdiepie");
  });

  it("getLatestSnapshot returns the most recent", async () => {
    await storage.saveSnapshot(makeSnapshot("mrbeast", "2026-07-01T12:00:00.000Z"));
    await storage.saveSnapshot(makeSnapshot("mrbeast", "2026-07-05T12:00:00.000Z"));
    await storage.saveSnapshot(makeSnapshot("mrbeast", "2026-07-03T12:00:00.000Z"));

    const latest = await storage.getLatestSnapshot("mrbeast");
    expect(latest?.capturedAt).toBe("2026-07-05T12:00:00.000Z");
  });

  it("getLatestSnapshot returns null for unknown creator", async () => {
    const latest = await storage.getLatestSnapshot("nonexistent");
    expect(latest).toBeNull();
  });

  it("hasSnapshotInBucket correctly identifies existing buckets", async () => {
    await storage.saveSnapshot(makeSnapshot("mrbeast", "2026-07-01T12:00:00.000Z"));

    expect(await storage.hasSnapshotInBucket("mrbeast", "2026-07-01")).toBe(true);
    expect(await storage.hasSnapshotInBucket("mrbeast", "2026-07-02")).toBe(false);
    expect(await storage.hasSnapshotInBucket("pewdiepie", "2026-07-01")).toBe(false);
  });

  it("getTrackedCreatorSlugs returns all tracked creators", async () => {
    await storage.saveSnapshot(makeSnapshot("mrbeast", "2026-07-01T12:00:00.000Z"));
    await storage.saveSnapshot(makeSnapshot("pewdiepie", "2026-07-01T12:00:00.000Z"));

    const slugs = await storage.getTrackedCreatorSlugs();
    expect(slugs).toContain("mrbeast");
    expect(slugs).toContain("pewdiepie");
    expect(slugs).toHaveLength(2);
  });
});

describe("dateToBucketKey", () => {
  it("converts a date to YYYY-MM-DD format", () => {
    expect(dateToBucketKey(new Date("2026-07-15T14:30:00.000Z"))).toBe("2026-07-15");
    expect(dateToBucketKey(new Date("2026-01-01T00:00:00.000Z"))).toBe("2026-01-01");
  });
});
