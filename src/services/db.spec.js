import { describe, it, expect, vi, beforeEach } from "vitest";

const load = vi.fn(async () => ({ id: "db-instance" }));
vi.mock("@tauri-apps/plugin-sql", () => ({ default: { load } }));

describe("getDb", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("loads the database once and caches it across calls", async () => {
    const { getDb } = await import("./db.js");
    const first = await getDb();
    const second = await getDb();
    expect(first).toBe(second);
    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith("sqlite:videoharvest.db");
  });

  it("shares one connection attempt across concurrent callers", async () => {
    const { getDb } = await import("./db.js");
    const [first, second] = await Promise.all([getDb(), getDb()]);
    expect(first).toBe(second);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("retries after a failed connection instead of caching the rejection", async () => {
    load.mockRejectedValueOnce(new Error("locked"));
    const { getDb } = await import("./db.js");
    await expect(getDb()).rejects.toThrow("locked");
    await expect(getDb()).resolves.toEqual({ id: "db-instance" });
  });
});
