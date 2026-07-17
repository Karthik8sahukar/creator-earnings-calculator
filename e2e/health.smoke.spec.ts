import { expect, test } from "@playwright/test";

test("/api/health returns 200 with the expected shape and never leaks env values", async ({
  request,
}) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  expect(res.headers()["cache-control"]).toBe("no-store");
  const body = (await res.json()) as Record<string, unknown>;
  expect(body).toMatchObject({
    status: "ok",
    service: "youtube-money-calculator",
    youtubeApiConfigured: true, // set to true in playwright.config webServer env
  });
  expect(typeof body.timestamp).toBe("string");
  const raw = await res.text();
  expect(raw).not.toContain("e2e-mock-placeholder-not-a-real-key");
});
