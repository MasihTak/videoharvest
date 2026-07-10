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
});
