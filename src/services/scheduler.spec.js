import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const db = { execute: vi.fn(async () => ({ lastInsertId: 1 })), select: vi.fn(async () => []) };
vi.mock("./db.js", () => ({ getDb: vi.fn(async () => db) }));

import {
  nextRunOnce,
  resolveDefaultRun,
  formatCountdown,
  listSchedules,
  listDueSchedules,
  listFailedSchedules,
  createSchedule,
  touchSchedule,
  setScheduleStatus,
  deleteSchedule,
} from "./scheduler.js";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.TZ = "UTC";
});

afterEach(() => {
  vi.useRealTimers();
});

describe("nextRunOnce", () => {
  it("converts a local date/time into sqlite UTC format", () => {
    expect(nextRunOnce("2026-07-10", "14:30")).toBe("2026-07-10 14:30:00");
  });
});

describe("resolveDefaultRun", () => {
  it("targets today when the default time hasn't passed yet", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-10T08:00:00Z"));
    expect(resolveDefaultRun("20:00")).toEqual({ date: "2026-07-10", time: "20:00" });
  });

  it("rolls over to tomorrow when the default time has already passed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-10T21:00:00Z"));
    expect(resolveDefaultRun("20:00")).toEqual({ date: "2026-07-11", time: "20:00" });
  });
});

describe("formatCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-10T12:00:00Z"));
  });

  it("returns null when there's no next_run", () => {
    expect(formatCountdown(null)).toBeNull();
  });

  it("returns 'overdue' once next_run has passed", () => {
    expect(formatCountdown("2026-07-10 11:00:00")).toBe("overdue");
  });

  it("formats minutes-only countdowns", () => {
    expect(formatCountdown("2026-07-10 12:05:00")).toBe("5m");
  });

  it("formats hours-only countdowns", () => {
    expect(formatCountdown("2026-07-10 14:30:00")).toBe("2h");
  });

  it("formats day+hour countdowns", () => {
    expect(formatCountdown("2026-07-11 15:00:00")).toBe("1d 3h");
  });

  it("formats whole-day countdowns without a trailing 0h", () => {
    expect(formatCountdown("2026-07-12 12:00:00")).toBe("2d");
  });
});

describe("db-backed schedule queries", () => {
  it("listSchedules joins downloads and orders by next_run", async () => {
    await listSchedules();
    expect(db.select).toHaveBeenCalledWith(expect.stringContaining("ORDER BY s.next_run ASC"));
  });

  it("listDueSchedules filters pending schedules due by now", async () => {
    await listDueSchedules("2026-07-10 12:00:00");
    expect(db.select).toHaveBeenCalledWith(expect.stringContaining("next_run <= $1"), [
      "2026-07-10 12:00:00",
    ]);
  });

  it("listFailedSchedules filters pending schedules on a failed download", async () => {
    await listFailedSchedules();
    expect(db.select).toHaveBeenCalledWith(expect.stringContaining("d.status = 'failed'"));
  });

  it("createSchedule inserts and returns the new id", async () => {
    db.execute.mockResolvedValueOnce({ lastInsertId: 42 });
    await expect(createSchedule({ downloadId: 7, nextRun: "2026-07-10 12:00:00" })).resolves.toBe(42);
    expect(db.execute).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO schedules"), [
      7,
      "2026-07-10 12:00:00",
    ]);
  });

  it("touchSchedule updates next_run/last_run/status", async () => {
    await touchSchedule(3, { nextRun: null, lastRun: "2026-07-10 12:00:00", status: "completed" });
    expect(db.execute).toHaveBeenCalledWith(expect.stringContaining("UPDATE schedules"), [
      null,
      "2026-07-10 12:00:00",
      "completed",
      3,
    ]);
  });

  it("setScheduleStatus updates just the status", async () => {
    await setScheduleStatus(3, "disabled");
    expect(db.execute).toHaveBeenCalledWith(expect.stringContaining("SET status = $1"), [
      "disabled",
      3,
    ]);
  });

  it("deleteSchedule removes the row", async () => {
    await deleteSchedule(3);
    expect(db.execute).toHaveBeenCalledWith(expect.stringContaining("DELETE FROM schedules"), [3]);
  });
});
