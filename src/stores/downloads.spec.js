import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";

vi.mock("@tauri-apps/api/path", () => ({
  downloadDir: vi.fn(async () => "/downloads"),
}));

vi.mock("@/services/sidecar.js", () => ({
  runYtdlp: vi.fn(async () => {}),
  cancelProcess: vi.fn(async () => {}),
  onOutput: vi.fn(() => Promise.resolve(() => {})),
  onDone: vi.fn(() => Promise.resolve(() => {})),
}));

vi.mock("@/services/db.js", () => ({
  getDb: vi.fn(async () => ({
    execute: vi.fn(async () => ({ lastInsertId: 1 })),
    select: vi.fn(async () => []),
  })),
}));
vi.mock("@/services/settings.js", () => ({ getSetting: vi.fn(async () => null) }));
vi.mock("@/services/logs.js", () => ({ writeLog: vi.fn(async () => {}) }));
vi.mock("@/services/notifications.js", () => ({ notify: vi.fn(async () => {}) }));

import { useDownloadsStore } from "./downloads.js";
import * as sidecar from "@/services/sidecar.js";
import { getDb } from "@/services/db.js";

// The store registers its sidecar event handlers at setup-time; grab whatever
// was last passed to onOutput/onDone so tests can drive them directly.
function latestHandler(mockFn) {
  return mockFn.mock.calls.at(-1)[0];
}

let store;

beforeEach(() => {
  vi.clearAllMocks();
  sidecar.onOutput.mockReturnValue(Promise.resolve(() => {}));
  sidecar.onDone.mockReturnValue(Promise.resolve(() => {}));
  // lastInsertId must be unique per enqueue: item ids are `dl-${Date.now()}-${lastInsertId}`,
  // and two enqueues in the same test can land in the same millisecond.
  let nextId = 1;
  getDb.mockResolvedValue({
    execute: vi.fn(async () => ({ lastInsertId: nextId++ })),
    select: vi.fn(async () => []),
  });
  setActivePinia(createPinia());
  store = useDownloadsStore();
});

describe("enqueue", () => {
  it("adds a pending item and starts the queue", async () => {
    await store.enqueue({ url: "https://x", title: "Video", selector: "137" });
    expect(store.items).toHaveLength(1);
    // start() sets this synchronously; runYtdlp itself fires a tick later via a
    // detached promise chain, so it isn't asserted here to avoid a timing race.
    expect(store.items[0]).toMatchObject({ status: "downloading", url: "https://x" });
  });

  it("leaves a second item pending while one is already downloading", async () => {
    await store.enqueue({ url: "https://a", title: "A", selector: "137" });
    await store.enqueue({ url: "https://b", title: "B", selector: "137" });
    expect(store.items.map((i) => i.status)).toEqual(["downloading", "pending"]);
  });
});

describe("onOutput handling", () => {
  it("updates progress and speed/eta on a progress line", async () => {
    await store.enqueue({ url: "https://x", title: "Video", selector: "137" });
    const onOutput = latestHandler(sidecar.onOutput);
    const item = store.items[0];
    onOutput({ id: item.id, line: "[download]  42.0% of 10.00MiB at  1.00MiB/s ETA 00:10" });
    expect(item.progress).toBe(42);
    expect(item.eta).toBe(10);
  });

  it("records the saved file path from a VHF-prefixed line", async () => {
    await store.enqueue({ url: "https://x", title: "Video", selector: "137" });
    const onOutput = latestHandler(sidecar.onOutput);
    const item = store.items[0];
    onOutput({ id: item.id, line: "VHF|/downloads/video.mp4" });
    expect(item.location).toBe("/downloads/video.mp4");
  });

  it("ignores output for an item that already left the downloading state", async () => {
    await store.enqueue({ url: "https://x", title: "Video", selector: "137" });
    const onOutput = latestHandler(sidecar.onOutput);
    const item = store.items[0];
    item.status = "canceled";
    onOutput({ id: item.id, line: "[download]  99.0% of 10.00MiB" });
    expect(item.progress).toBe(0);
  });
});

describe("fail", () => {
  it("classifies the error and marks the item failed via a non-zero exit code", async () => {
    await store.enqueue({ url: "https://x", title: "Video", selector: "137" });
    const item = store.items[0];
    const onOutput = latestHandler(sidecar.onOutput);
    onOutput({ id: item.id, kind: "stderr", line: "ERROR: Private video. Sign in if you've been granted access" });
    const onDone = latestHandler(sidecar.onDone);
    await onDone({ id: item.id, code: 1 });
    expect(item.status).toBe("failed");
    expect(item.error).toBe("This video is private or members-only.");
    expect(item.retryable).toBe(false);
  });
});

describe("cancel", () => {
  it("does nothing for an item that isn't downloading", async () => {
    await store.enqueue({ url: "https://a", title: "A", selector: "137" });
    await store.enqueue({ url: "https://b", title: "B", selector: "137" });
    const pendingItem = store.items[1];
    await store.cancel(pendingItem.id);
    expect(pendingItem.status).toBe("pending");
    expect(sidecar.cancelProcess).not.toHaveBeenCalled();
  });

  it("cancels a downloading item and advances the queue", async () => {
    await store.enqueue({ url: "https://a", title: "A", selector: "137" });
    await store.enqueue({ url: "https://b", title: "B", selector: "137" });
    const runningItem = store.items[0];
    await store.cancel(runningItem.id);
    expect(runningItem.status).toBe("canceled");
    expect(sidecar.cancelProcess).toHaveBeenCalledWith(runningItem.id);
    expect(store.items[1].status).toBe("downloading");
  });
});

describe("enqueuePlaylist", () => {
  it("queues every entry under a shared playlistId, starting only the first", async () => {
    await store.enqueuePlaylist({
      entries: [
        { url: "https://a", title: "A" },
        { url: "https://b", title: "B" },
      ],
      selector: "137",
      format: "video",
      playlistTitle: "My Playlist",
    });
    expect(store.items.map((i) => i.status)).toEqual(["downloading", "pending"]);
    expect(store.items[0].playlistId).toBe(store.items[1].playlistId);
    expect(store.items[0].playlistTitle).toBe("My Playlist");
  });
});

describe("start failure", () => {
  it("fails the item when runYtdlp itself throws", async () => {
    sidecar.runYtdlp.mockRejectedValueOnce(new Error("spawn failed"));
    await store.enqueue({ url: "https://x", title: "Video", selector: "137" });
    // start()'s catch path runs after the same microtask chain that resolves runYtdlp's
    // rejection; flush it before asserting.
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    const item = store.items[0];
    expect(item.status).toBe("failed");
    expect(item.error).toContain("spawn failed");
  });
});

describe("cancelPlaylist", () => {
  it("cancels every pending entry and the currently running one", async () => {
    await store.enqueuePlaylist({
      entries: [
        { url: "https://a", title: "A" },
        { url: "https://b", title: "B" },
        { url: "https://c", title: "C" },
      ],
      selector: "137",
      format: "video",
      playlistTitle: "PL",
    });
    const playlistId = store.items[0].playlistId;
    await store.cancelPlaylist(playlistId);
    expect(store.items.map((i) => i.status)).toEqual(["canceled", "canceled", "canceled"]);
    expect(sidecar.cancelProcess).toHaveBeenCalledWith(store.items[0].id);
  });
});

describe("requeueByDbId", () => {
  it("re-queues a failed item found by its DB id", async () => {
    await store.enqueue({ url: "https://x", title: "Video", selector: "137" });
    const item = store.items[0];
    const onDone = latestHandler(sidecar.onDone);
    await onDone({ id: item.id, code: 1 });
    expect(item.status).toBe("failed");

    await store.requeueByDbId(item.dbId);
    expect(item.status).toBe("downloading");
    expect(item.progress).toBe(0);
  });

  it("is a no-op when the matching item is already downloading", async () => {
    await store.enqueue({ url: "https://x", title: "Video", selector: "137" });
    const item = store.items[0];
    item.progress = 50;
    await store.requeueByDbId(item.dbId);
    expect(item.progress).toBe(50);
    expect(item.status).toBe("downloading");
  });
});

describe("load", () => {
  it("marks interrupted downloads failed and hydrates items from the DB", async () => {
    const db = {
      execute: vi.fn(async () => ({})),
      select: vi.fn(async () => [
        { id: 1, url: "https://x", title: "Video", status: "completed", location: "/f.mp4", format: "video", progress: 100, selector: "137", error: null, playlist_id: null, playlist_title: null },
      ]),
    };
    getDb.mockResolvedValue(db);

    await store.load();
    expect(db.execute).toHaveBeenCalledWith(expect.stringContaining("status IN ('downloading', 'pending')"));
    expect(store.items).toHaveLength(1);
    expect(store.items[0]).toMatchObject({ dbId: 1, status: "completed", location: "/f.mp4" });
  });

  it("only loads once per store instance", async () => {
    const db = { execute: vi.fn(async () => ({})), select: vi.fn(async () => []) };
    getDb.mockResolvedValue(db);
    await store.load();
    await store.load();
    expect(db.select).toHaveBeenCalledTimes(1);
  });
});

describe("onDone success", () => {
  it("completes the item, notifies, and starts the next pending one", async () => {
    await store.enqueue({ url: "https://a", title: "A", selector: "137" });
    await store.enqueue({ url: "https://b", title: "B", selector: "137" });
    const a = store.items[0];
    const onDone = latestHandler(sidecar.onDone);
    await onDone({ id: a.id, code: 0 });
    expect(a.status).toBe("completed");
    expect(a.progress).toBe(100);
    expect(store.items[1].status).toBe("downloading");
  });
});

describe("remove", () => {
  it("is a no-op for an unknown id", async () => {
    await store.remove("nope");
    expect(store.items).toHaveLength(0);
  });

  it("deletes a pending item without touching the sidecar process", async () => {
    await store.enqueue({ url: "https://a", title: "A", selector: "137" });
    await store.enqueue({ url: "https://b", title: "B", selector: "137" });
    const b = store.items[1];
    await store.remove(b.id);
    expect(sidecar.cancelProcess).not.toHaveBeenCalled();
    expect(store.items.map((i) => i.id)).not.toContain(b.id);
  });

  it("cancels a downloading item before deleting it", async () => {
    await store.enqueue({ url: "https://x", title: "Video", selector: "137" });
    const item = store.items[0];
    await store.remove(item.id);
    expect(sidecar.cancelProcess).toHaveBeenCalledWith(item.id);
    expect(store.items).toHaveLength(0);
  });
});

describe("retry", () => {
  it("re-queues a failed item and immediately restarts it since the queue is free", async () => {
    await store.enqueue({ url: "https://x", title: "Video", selector: "137" });
    const item = store.items[0];
    const onDone = latestHandler(sidecar.onDone);
    await onDone({ id: item.id, code: 1 });
    expect(item.status).toBe("failed");

    await store.retry(item.id);
    expect(item.status).toBe("downloading");
    expect(item.progress).toBe(0);
  });

  it("does not auto-start a retried item while another item is active", async () => {
    await store.enqueue({ url: "https://a", title: "A", selector: "137" });
    await store.enqueue({ url: "https://b", title: "B", selector: "137" });
    const b = store.items[1];
    b.status = "failed";

    await store.retry(b.id);
    expect(b.status).toBe("pending");
  });

  it("is a no-op for an item that's still downloading", async () => {
    await store.enqueue({ url: "https://x", title: "Video", selector: "137" });
    const item = store.items[0];
    await store.retry(item.id);
    expect(item.status).toBe("downloading");
  });
});
