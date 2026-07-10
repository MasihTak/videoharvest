import { describe, it, expect, vi, beforeEach } from "vitest";

const db = { execute: vi.fn(async () => ({})), select: vi.fn(async () => []) };
vi.mock("./db.js", () => ({ getDb: vi.fn(async () => db) }));

import { getSetting, setSetting } from "./settings.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getSetting", () => {
  it("returns the stored value when the key exists", async () => {
    db.select.mockResolvedValueOnce([{ value: "1" }]);
    expect(await getSetting("notifications_enabled")).toBe("1");
    expect(db.select).toHaveBeenCalledWith("SELECT value FROM settings WHERE key = $1", [
      "notifications_enabled",
    ]);
  });

  it("returns the fallback when the key is missing", async () => {
    db.select.mockResolvedValueOnce([]);
    expect(await getSetting("missing_key", "default")).toBe("default");
  });

  it("defaults the fallback to null", async () => {
    db.select.mockResolvedValueOnce([]);
    expect(await getSetting("missing_key")).toBeNull();
  });
});

describe("setSetting", () => {
  it("upserts the key/value pair", async () => {
    await setSetting("download_dir", "/downloads");
    expect(db.execute).toHaveBeenCalledWith(expect.stringContaining("ON CONFLICT(key)"), [
      "download_dir",
      "/downloads",
    ]);
  });
});
