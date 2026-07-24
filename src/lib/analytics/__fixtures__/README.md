# Analytics Test Fixtures

These JSON files are **clearly labeled test fixtures** used for:
- Unit tests (growth calculations)
- E2E tests (chart rendering)
- Development (populated analytics UI)

## Important

- These are **NOT production data**
- These are **NOT live YouTube statistics**
- Values are **illustrative approximations** for testing purposes only
- Never present these values as actual creator statistics

## Usage

### In unit tests (vitest)

```typescript
import fixtures from "../__fixtures__/mrbeast.json";
// fixtures is an array of CreatorSnapshot objects
```

### In E2E mode

When `E2E_MOCK_MODE=1` is set, the analytics API route returns
fixture data instead of reading from the storage adapter.

### In development

Copy a fixture file to `data/analytics/{slug}.json` to populate
the analytics section on a creator's profile page during local dev.
