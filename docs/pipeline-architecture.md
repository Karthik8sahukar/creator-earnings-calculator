# Creator Data Pipeline — Architecture

## Overview

A scalable ingestion pipeline designed to support 10,000+ creators without
changing any existing routes, components, or UI. The pipeline operates on an
intermediate JSON format (`data/pipeline/creators.json`) that can be validated,
enriched, and merged into the canonical dataset independently.

## Pipeline Flow

```
┌───────────────────┐     ┌──────────────────────────┐
│  External Input   │     │  import-creators.ts       │
│  ─ CSV files      │────▶│  ─ Validates required     │
│  ─ JSON files     │     │    fields                 │
│  ─ Inline CLI     │     │  ─ Generates slugs        │
│  ─ API discovery  │     │  ─ Detects duplicates on  │
└───────────────────┘     │    4 axes                 │
                          │  ─ Writes pipeline JSON   │
                          └────────────┬─────────────┘
                                       │
                                       ▼
                          ┌──────────────────────────┐
                          │  data/pipeline/           │
                          │  creators.json            │
                          │  (intermediate format)    │
                          └──────┬───────┬───────┬──┘
                                 │       │       │
              ┌──────────────────┘       │       └──────────────────┐
              ▼                          ▼                          ▼
┌──────────────────────┐   ┌──────────────────────┐   ┌─────────────────────┐
│  verify-creators-v2  │   │  enrich-creators-v2  │   │  validate-creators  │
│  ─ channels.list     │   │  ─ channels.list     │   │  ─ Schema checks    │
│  ─ Confidence score  │   │    (batch of 50)     │   │  ─ Duplicate detect │
│  ─ Handle + title    │   │  ─ Avatar/banner     │   │  ─ Ref. integrity   │
│    matching          │   │  ─ Subscriber count  │   │  ─ Health score     │
│  ─ ≥80% → verified  │   │  ─ View count        │   │  ─ Exit code for CI │
│  ─ 50-79% → review  │   │  ─ Tier computation  │   └──────────┬──────────┘
│  ─ <50% → mismatch  │   │  ─ Staleness-aware   │              │
└──────────┬───────────┘   └──────────┬───────────┘              │
           │                          │                          │
           ▼                          ▼                          ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  reports/                                                                │
│  ─ verification-report.md    (verified / probable / not-found)           │
│  ─ validation-report.md      (errors / warnings / health score)          │
│  ─ duplicates.json           (duplicate matches with confidence)         │
│  ─ missing-channel-ids.json  (creators needing API verification)         │
│  ─ enrichment-report.md      (stats snapshot per creator)                │
└────────────────────────────────────────────────────────┬─────────────────┘
                                                         │
                                                         ▼
                                            ┌─────────────────────────┐
                                            │  build-search-index.ts  │
                                            │  ─ Tokenizes all fields │
                                            │  ─ Includes aliases     │
                                            │  ─ Relevance scoring    │
                                            │  ─ Deterministic output │
                                            └────────────┬────────────┘
                                                         │
                                                         ▼
                                            ┌─────────────────────────────┐
                                            │  src/data/creators/          │
                                            │  ─ dataset.ts (canonical)    │
                                            │  ─ search-index.ts (runtime) │
                                            │  ─ schema.ts (types)         │
                                            └─────────────────────────────┘
```

## Duplicate Detection (4 axes)

| Axis | Comparison Method | Confidence |
|------|------------------|------------|
| **Slug** | Exact match | Exact |
| **Channel ID** | Exact match (UC + 22 chars) | Exact |
| **Handle** | Case-insensitive, stripped @ | High |
| **Normalized Name** | Lowercased, non-alphanumeric removed | Medium |

## Validation Checks (12 categories)

| # | Check | Severity |
|---|-------|----------|
| 1 | Required fields (name, handle, slug) | Error |
| 2 | Handle format (@[A-Za-z0-9_.-]{1,60}) | Error |
| 3 | Channel ID format (UC + 22 chars) | Error |
| 4 | Country code (ISO-3166 alpha-2 or OTHER) | Error |
| 5 | Niche ID (member of NICHES table) | Error |
| 6 | Content type (long/shorts/mixed) | Error |
| 7 | Subscriber tier (mega/large/mid/emerging) | Error |
| 8 | Verified ↔ channelId correlation | Error |
| 9 | Slug uniqueness | Error |
| 10 | Channel ID uniqueness | Error |
| 11 | Handle uniqueness | Error |
| 12 | Description quality (≥10 chars) | Warning |

## Slug Stability Contract

- **Existing slugs in dataset.ts are NEVER regenerated.**
- The `import-creators.ts` script only generates slugs for NEW creators
  that don't provide one in the input.
- Once a slug is assigned and committed to `dataset.ts` or
  `creators.json`, it is immutable.
- The `validate-creators.ts` script checks for slug duplicates but
  never modifies existing slugs.

## Search Index Architecture

```
Input fields per creator:
  ├── name → full name + individual words + normalized
  ├── handle → without @
  ├── aliases → each alias: full + words + normalized
  ├── country → name + code
  ├── category → lowercased
  ├── niche → lowercased
  └── language → lowercased

Output: Array<SearchIndexEntry>
  ├── slug (for linking)
  ├── name (for display)
  ├── handle (for display)
  ├── aliases (for display)
  ├── country, countryCode, category, niche (for filters)
  └── tokens[] (pre-computed, deduplicated, sorted)
```

**Scoring** (higher = more relevant):
- Exact name match: 100
- Name starts with query: 80
- Handle match: 90
- Alias exact match: 85
- Token exact match: 50
- Token starts-with: 30
- Token contains: 10

## npm Scripts

```bash
npm run pipeline:import         # Import from JSON/CSV
npm run pipeline:verify         # YouTube API verification
npm run pipeline:enrich         # Batch enrichment
npm run pipeline:search-index   # Build search index
npm run pipeline:validate       # Full validation (CI-friendly)
```

## Determinism

All generated artifacts are deterministic:
- `search-index.json`: tokens are sorted alphabetically within each entry
- `duplicates.json`: ordered by first-seen in the dataset
- `missing-channel-ids.json`: ordered by dataset position
- `creators.json`: ordered by import time (append-only)

Running the same pipeline on the same input always produces identical output.
