import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";

vi.mock("@/services/scheduler.js", () => ({
  listSchedules: vi.fn(async () => []),
  listDueSchedules: vi.fn(async () => []),
  listFailedSchedules: vi.fn(async () => []),
  createSchedule: vi.fn(async () => 1),
  touchSchedule: vi.fn(async () => {}),
  setScheduleStatus: vi.fn(async () => {}),
  deleteSchedule: vi.fn(async () => {}),
}));
vi.mock("@/services/settings.js", () => ({ getSetting: vi.fn(async () => "1") }));
vi.mock("@/services/logs.js", () => ({ writeLog: vi.fn(async () => {}) }));
vi.mock("@/services/notifications.js", () => ({ notify: vi.fn(async () => {}) }));

const downloadsStore = { load: vi.fn(async () => {}), requeueByDbId: vi.fn(async () => {}) };
vi.mock("@/stores/downloads.js", () => ({ useDownloadsStore: () => downloadsStore }));

import { useSchedulerStore } from "./scheduler.js";
import * as schedulerService from "@/services/scheduler.js";
import { getSetting } from "@/services/settings.js";

let store;

beforeEach(() => {
  vi.clearAllMocks();
  getSetting.mockResolvedValue("1");
  setActivePinia(createPinia());
  store = useSchedulerStore();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("load", () => {
  it("populates items from listSchedules", async () => {
    schedulerService.listSchedules.mockResolvedValue([{ id: 1 }]);
    await store.load();
    expect(store.items).toEqual([{ id: 1 }]);
  });
});

describe("create", () => {
  it("creates the schedule then reloads", async () => {
    await store.create({ downloadId: 5, nextRun: "2026-07-10 12:00:00" });
    expect(schedulerService.createSchedule).toHaveBeenCalledWith({
      downloadId: 5,
      nextRun: "2026-07-10 12:00:00",
    });
    expect(schedulerService.listSchedules).toHaveBeenCalled();
  });
});

describe("toggle", () => {
  it("disables a pending schedule", async () => {
    await store.toggle({ id: 1, status: "pending" });
    expect(schedulerService.setScheduleStatus).toHaveBeenCalledWith(1, "disabled");
  });

  it("re-enables a disabled schedule back to pending", async () => {
    await store.toggle({ id: 1, status: "disabled" });
    expect(schedulerService.setScheduleStatus).toHaveBeenCalledWith(1, "pending");
  });
});

describe("remove", () => {
  it("deletes the schedule and drops it from items", async () => {
    schedulerService.listSchedules.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    await store.load();
    await store.remove(1);
    expect(schedulerService.deleteSchedule).toHaveBeenCalledWith(1);
    expect(store.items.map((s) => s.id)).toEqual([2]);
  });
});

// runDue() is only reachable through startPolling(), which fires it once
// immediately (fire-and-forget) before arming the interval. Flush the
// microtask queue after calling it so runDue's internal awaits settle.
async function flush() {
  for (let i = 0; i < 8; i += 1) await Promise.resolve();
}

describe("runDue (via startPolling)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("does nothing when the scheduler is disabled", async () => {
    getSetting.mockResolvedValue("0");
    store.startPolling();
    await flush();
    expect(schedulerService.listDueSchedules).not.toHaveBeenCalled();
  });

  it("does nothing when nothing is due and retry-failed is off", async () => {
    schedulerService.listDueSchedules.mockResolvedValue([]);
    store.startPolling();
    await flush();
    expect(downloadsStore.load).not.toHaveBeenCalled();
  });

  it("requeues each due schedule's download and marks it completed", async () => {
    schedulerService.listDueSchedules.mockResolvedValue([{ id: 1, download_id: 10 }]);
    store.startPolling();
    await flush();
    expect(downloadsStore.load).toHaveBeenCalled();
    expect(downloadsStore.requeueByDbId).toHaveBeenCalledWith(10);
    expect(schedulerService.touchSchedule).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ status: "completed" }),
    );
  });

  it("merges in failed schedules not already due when retry-failed is on", async () => {
    getSetting.mockImplementation(async (key) => (key === "scheduler_retry_failed" ? "1" : "1"));
    schedulerService.listDueSchedules.mockResolvedValue([{ id: 1, download_id: 10 }]);
    schedulerService.listFailedSchedules.mockResolvedValue([
      { id: 1, download_id: 10 },
      { id: 2, download_id: 20 },
    ]);
    store.startPolling();
    await flush();
    expect(downloadsStore.requeueByDbId).toHaveBeenCalledWith(10);
    expect(downloadsStore.requeueByDbId).toHaveBeenCalledWith(20);
    expect(downloadsStore.requeueByDbId).toHaveBeenCalledTimes(2);
  });
});

describe("startPolling", () => {
  it("runs due schedules immediately and only sets one interval", () => {
    vi.useFakeTimers();
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval");
    store.startPolling();
    store.startPolling();
    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
  });
});
