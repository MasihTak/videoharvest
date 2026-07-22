import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";

vi.mock("@/services/settings.js", () => ({ getSetting: vi.fn(async () => null) }));
vi.mock("@tauri-apps/api/path", () => ({ downloadDir: vi.fn(async () => "/downloads") }));

import { useSettingsStore } from "./settings.js";
import { getSetting } from "@/services/settings.js";

beforeEach(() => {
  vi.clearAllMocks();
  setActivePinia(createPinia());
});

describe("load", () => {
  it("falls back to the OS download dir when nothing is stored", async () => {
    getSetting.mockResolvedValue(null);
    const store = useSettingsStore();
    await store.load();
    expect(store.downloadFolder).toBe("/downloads");
  });

  it("coerces stored '1'/'0' flags to booleans", async () => {
    getSetting.mockImplementation(async (key, fallback) => {
      if (key === "scheduler_enabled") return "0";
      if (key === "default_best_quality") return "1";
      return fallback ?? null;
    });
    const store = useSettingsStore();
    await store.load();
    expect(store.schedulerEnabled).toBe(false);
    expect(store.defaultBestQuality).toBe(true);
  });

  it("only fetches once across repeated calls", async () => {
    const store = useSettingsStore();
    await store.load();
    await store.load();
    expect(getSetting).toHaveBeenCalledTimes(7);
  });
});
