// Scheduled downloads: queues a download to start at a future time, once.
// Polls the schedules table on a timer and hands off to the single
// download-manager flow to actually run.

import { defineStore, acceptHMRUpdate } from "pinia";
import { ref } from "vue";
import {
  listSchedules,
  listDueSchedules,
  listFailedSchedules,
  createSchedule,
  touchSchedule,
  setScheduleStatus,
  deleteSchedule,
} from "@/services/scheduler.js";
import { getSetting } from "@/services/settings.js";
import { useDownloadsStore } from "@/stores/downloads.js";
import { writeLog } from "@/services/logs.js";

const POLL_MS = 30_000;

export const useSchedulerStore = defineStore("scheduler", () => {
  const items = ref([]);
  let loaded = false;
  let timer = null;

  async function load() {
    items.value = await listSchedules();
    loaded = true;
  }

  async function create({ downloadId, nextRun }) {
    await createSchedule({ downloadId, nextRun });
    await load();
  }

  async function toggle(schedule) {
    const status = schedule.status === "disabled" ? "pending" : "disabled";
    await setScheduleStatus(schedule.id, status);
    await load();
  }

  async function remove(id) {
    await deleteSchedule(id);
    items.value = items.value.filter((s) => s.id !== id);
  }

  async function runDue() {
    if ((await getSetting("scheduler_enabled", "1")) !== "1") return;
    const nowIso = new Date().toISOString().slice(0, 19).replace("T", " ");
    const due = await listDueSchedules(nowIso);
    if ((await getSetting("scheduler_retry_failed", "0")) === "1") {
      const failed = await listFailedSchedules();
      for (const f of failed) if (!due.some((d) => d.id === f.id)) due.push(f);
    }
    if (!due.length) return;

    const downloads = useDownloadsStore();
    await downloads.load();
    for (const schedule of due) {
      await downloads.requeueByDbId(schedule.download_id);
      await writeLog("INFO", `Scheduled download started (schedule #${schedule.id})`);
      await touchSchedule(schedule.id, { nextRun: null, lastRun: nowIso, status: "completed" });
    }
    await load();
  }

  function startPolling() {
    if (timer) return;
    if (!loaded) load();
    runDue();
    timer = setInterval(runDue, POLL_MS);
  }

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      if (timer) clearInterval(timer);
    });
  }

  return { items, load, create, toggle, remove, startPolling };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSchedulerStore, import.meta.hot));
}
