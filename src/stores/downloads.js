// The single download-manager flow: a sequential queue over yt-dlp.
// Owns queue state, live progress, persistence, and OS notifications.

import { defineStore, acceptHMRUpdate } from "pinia";
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
      "UPDATE downloads SET status = $1, progress = $2, location = $3, error = $4, updated_at = datetime('now') WHERE id = $5",
      [status, Math.round(item.progress), item.location, item.error ?? null, item.dbId],
    );
  }

  function noteError(item, line) {
    if (line.startsWith("ERROR:")) item.errorRaw = line.slice("ERROR:".length).trim();
  }

  // yt-dlp streams output faster than a single DB write; chain writes so the
  // raw lines land in the log in the same order the process printed them.
  let logTail = Promise.resolve();
  function logLine(line) {
    const text = line.trim();
    if (!text) return;
    const level = text.startsWith("ERROR:")
      ? "ERROR"
      : text.startsWith("WARNING:")
        ? "WARNING"
        : "INFO";
    logTail = logTail.then(() => writeLog(level, text)).catch(() => {});
  }

  async function enqueue({
    url,
    title,
    selector,
    format,
    playlistId = null,
    playlistTitle = null,
    autostart = true,
  }) {
    const db = await getDb();
    const res = await db.execute(
      "INSERT INTO downloads (url, title, status, format, selector, playlist_id, playlist_title) VALUES ($1, $2, 'pending', $3, $4, $5, $6)",
      [url, title, format, selector, playlistId, playlistTitle],
    );
    items.value.push({
      id: `dl-${Date.now()}-${res.lastInsertId}`,
      dbId: res.lastInsertId,
      url,
      title,
      format,
      selector,
      playlistId,
      playlistTitle,
      status: "pending",
      progress: 0,
      speed: null,
      eta: null,
      location: null,
      error: null,
      errorRaw: null,
      retryable: true,
    });
    await writeLog("INFO", `Queued: ${title || url}`);
    if (autostart) pump();
    return res.lastInsertId;
  }

  // Queue every selected playlist entry as its own download job, sharing a
  // playlistId so DownloadsPage can roll them up into one progress bar.
  async function enqueuePlaylist({ entries, selector, format, playlistTitle }) {
    const playlistId = `pl-${Date.now()}`;
    for (const entry of entries) {
      await enqueue({
        url: entry.url,
        title: entry.title,
        selector,
        format,
        playlistId,
        playlistTitle,
      });
    }
  }

  async function start(item) {
    item.status = "downloading";
    item.error = null;
    item.errorRaw = null;
    await writeLog("INFO", `Started download: ${item.title || item.url}`);
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
    await notify("Download failed", item.title || item.url);
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

  // Re-queue an already-loaded download by its DB id (used by the scheduler,
  // which only knows the DB id, not the runtime item id).
  async function requeueByDbId(dbId) {
    const item = items.value.find((it) => it.dbId === dbId);
    if (!item || item.status === "downloading") return;
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
      "UPDATE downloads SET status = 'failed', error = 'Interrupted when the app closed — retry to resume.' WHERE status IN ('downloading', 'pending')",
    );
    const rows = await db.select(
      "SELECT id, url, title, status, location, format, progress, selector, error, playlist_id, playlist_title FROM downloads ORDER BY id ASC",
    );
    items.value = rows.map((r) => ({
      id: `db-${r.id}`,
      dbId: r.id,
      url: r.url,
      title: r.title,
      format: r.format,
      selector: r.selector,
      playlistId: r.playlist_id,
      playlistTitle: r.playlist_title,
      status: r.status,
      progress: r.progress ?? 0,
      speed: null,
      eta: null,
      location: r.location,
      error: r.error,
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
    // Everything that isn't progress spam or the filepath marker is real
    // yt-dlp output ([youtube] extraction, Destination, Merger, warnings) —
    // persist it so the log reads like the command line.
    logLine(payload.line);
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

  return { items, enqueue, enqueuePlaylist, cancel, remove, retry, requeueByDbId, load };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDownloadsStore, import.meta.hot));
}
