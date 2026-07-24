/**
 * Database client for analytics.
 *
 * Uses Drizzle ORM with the Neon HTTP driver (drizzle-orm/neon-http).
 * This combination provides:
 *   - Fully typed queries (no Record<string, any> handling)
 *   - HTTP-based connections (stateless, no leaks in serverless)
 *   - Compatible with Vercel Edge and Node.js functions
 *
 * The client is lazily created on first access. It requires
 * DATABASE_URL to be set in the environment.
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema.db";

let _db: ReturnType<typeof createDb> | null = null;

function createDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Cannot create analytics database client.",
    );
  }
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

/**
 * Get the Drizzle database client. Lazily instantiated.
 * Throws if DATABASE_URL is not configured.
 */
export function getDb() {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

export type AnalyticsDb = ReturnType<typeof getDb>;
