// The single download-manager flow: a sequential queue over yt-dlp.
// Owns queue state, live progress, persistence, and OS notifications.

import { defineStore } from "pinia";
import { ref } from "vue";
import { downloadDir } from "@tauri-apps/api/path";
import { runYtdlp, cancelProcess, onOutput, onDone } from "@/services/sidecar.js";
import { buildArgs, parseProgress, parseFilepath, classifyError } from "@/services/download.js";
import { getDb } from "@/services/db.js";
import { getSetting } from "@/services/settings.js";
import { writeLog } from "@/services/logs.js";
import { notify } from "@/services/notifications.js";

async function effectiveDir() {
  return (await getSetting("download_dir")) ?? (await downloadDir());
}

export const useDownloadsStore = defineStore("downloads", () => {
  const items = ref([]);
  let loaded = false;

  const find = (id) => items.value.find((it) => it.id === id);
  const active = () => items.value.find((it) => it.status === "downloading");

  async function setStatus(item, status, extra = {}) {
    Object.assign(item, { status }, extra);
    const db = await getDb();
    await db.execute(
      "UPDATE downloads SET status = $1, progress = $2, location = $3, updated_at = datetime('now') WHERE id = $4",
      [status, Math.round(item.progress), item.location, item.dbId],
    );
  }

  function noteError(item, line) {
    if (line.startsWith("ERROR:")) item.errorRaw = line.slice("ERROR:".length).trim();
  }

  async function enqueue({ url, title, selector, format }) {
    const db = await getDb();
    const res = await db.execute(
      "INSERT INTO downloads (url, title, status, format, selector) VALUES ($1, $2, 'pending', $3, $4)",
      [url, title, format, selector],
    );
    items.value.push({
      id: `dl-${Date.now()}-${res.lastInsertId}`,
      dbId: res.lastInsertId,
      url,
      title,
      format,
      selector,
      status: "pending",
      progress: 0,
      speed: null,
      eta: null,
      location: null,
      error: null,
      errorRaw: null,
      retryable: true,
    });
    pump();
  }

  async function start(item) {
    item.status = "downloading";
    item.error = null;
    item.errorRaw = null;
    try {
      const dir = await effectiveDir();
      await runYtdlp(item.id, buildArgs({ selector: item.selector, dir, url: item.url }));
    } catch (e) {
      await fail(item, String(e));
    }
  }

  function pump() {
    if (active()) return;
    const next = items.value.find((it) => it.status === "pending");
    if (next) start(next);
  }

  async function fail(item, msg) {
    const raw = item.errorRaw || msg;
    const { message, retryable } = classifyError(raw);
    item.error = message;
    item.retryable = retryable;
    await setStatus(item, "failed");
    await writeLog("ERROR", `Download failed: ${item.title || item.url} — ${raw}`);
    pump();
  }

  async function cancel(id) {
    const item = find(id);
    if (!item || item.status !== "downloading") return;
    await cancelProcess(id);
    await setStatus(item, "canceled");
    pump();
  }

  async function retry(id) {
    const item = find(id);
    if (!item || !item.selector) return;
    if (item.status !== "failed" && item.status !== "canceled") return;
    Object.assign(item, { progress: 0, speed: null, eta: null, location: null });
    await setStatus(item, "pending");
    pump();
  }

  async function remove(id) {
    const item = find(id);
    if (!item) return;
    if (item.status === "downloading") await cancel(id);
    const db = await getDb();
    await db.execute("DELETE FROM downloads WHERE id = $1", [item.dbId]);
    items.value = items.value.filter((it) => it.id !== id);
  }

  async function load() {
    if (loaded) return;
    loaded = true;
    const db = await getDb();
    // Anything left mid-flight when the app last closed can't be resumed.
    await db.execute(
      "UPDATE downloads SET status = 'failed' WHERE status IN ('downloading', 'pending')",
    );
    const rows = await db.select(
      "SELECT id, url, title, status, location, format, progress, selector FROM downloads ORDER BY id DESC",
    );
    items.value = rows.map((r) => ({
      id: `db-${r.id}`,
      dbId: r.id,
      url: r.url,
      title: r.title,
      format: r.format,
      selector: r.selector,
      status: r.status,
      progress: r.progress ?? 0,
      speed: null,
      eta: null,
      location: r.location,
      error: null,
      errorRaw: null,
      retryable: true,
    }));
  }

  const unlistenOutput = onOutput((payload) => {
    const item = find(payload.id);
    if (!item) return;
    const p = parseProgress(payload.line);
    if (p) {
      if (p.percent != null) item.progress = p.percent;
      item.speed = p.speed;
      item.eta = p.eta;
      return;
    }
    const file = parseFilepath(payload.line);
    if (file) {
      item.location = file;
      return;
    }
    if (payload.kind === "stderr") {
      noteError(item, payload.line);
    }
  });

  const unlistenDone = onDone(async (payload) => {
    const item = find(payload.id);
    if (!item || item.status !== "downloading") return;
    if (payload.code === 0) {
      item.progress = 100;
      await setStatus(item, "completed");
      await writeLog("SUCCESS", `Downloaded: ${item.title || item.url}`);
      await notify("Download complete", item.title || item.url);
    } else {
      await fail(item, `exit code ${payload.code}`);
      return;
    }
    pump();
  });

  if (import.meta.hot) {
    import.meta.hot.dispose(async () => {
      (await unlistenOutput)();
      (await unlistenDone)();
    });
  }

  return { items, enqueue, cancel, remove, retry, load };
});
