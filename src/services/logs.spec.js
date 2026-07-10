import { describe, it, expect, vi, beforeEach } from "vitest";

const db = { execute: vi.fn(async () => ({})), select: vi.fn(async () => []) };
vi.mock("./db.js", () => ({ getDb: vi.fn(async () => db) }));

import { writeLog, getLogs, clearLogs } from "./logs.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("writeLog", () => {
  it("inserts a level/message row", async () => {
    await writeLog("ERROR", "Download failed");
    expect(db.execute).toHaveBeenCalledWith("INSERT INTO logs (level, message) VALUES ($1, $2)", [
      "ERROR",
      "Download failed",
    ]);
  });
});

describe("getLogs", () => {
  it("defaults to the 500 most recent entries", async () => {
    await getLogs();
    expect(db.select).toHaveBeenCalledWith(expect.stringContaining("ORDER BY id DESC LIMIT $1"), [500]);
  });

  it("accepts a custom limit", async () => {
    await getLogs(10);
    expect(db.select).toHaveBeenCalledWith(expect.any(String), [10]);
  });
});

describe("clearLogs", () => {
  it("deletes all log rows", async () => {
    await clearLogs();
    expect(db.execute).toHaveBeenCalledWith("DELETE FROM logs");
  });
});
