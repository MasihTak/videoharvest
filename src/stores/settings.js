// App preference state. Loaded once at app bootstrap (see App.vue) so pages
// that read these values never render a guessed default before the real one
// arrives — avoids the toggle flicker a page-local onMounted fetch causes.

import { defineStore, acceptHMRUpdate } from "pinia";
import { ref } from "vue";
import { downloadDir } from "@tauri-apps/api/path";
import { getSetting } from "@/services/settings.js";

export const useSettingsStore = defineStore("settings", () => {
  const downloadFolder = ref("");
  const schedulerEnabled = ref(true);
  const schedulerRetryFailed = ref(false);
  const schedulerDefaultTime = ref("02:00");
  const notificationsEnabled = ref(true);
  const defaultFormat = ref("full");
  const defaultBestQuality = ref(false);
  let loaded = false;

  async function load() {
    if (loaded) return;
    loaded = true;
    downloadFolder.value = (await getSetting("download_dir")) ?? (await downloadDir());
    schedulerEnabled.value = (await getSetting("scheduler_enabled", "1")) === "1";
    schedulerRetryFailed.value = (await getSetting("scheduler_retry_failed", "0")) === "1";
    schedulerDefaultTime.value = await getSetting("scheduler_default_time", "02:00");
    notificationsEnabled.value = (await getSetting("notifications_enabled", "1")) === "1";
    defaultFormat.value = await getSetting("default_format", "full");
    defaultBestQuality.value = (await getSetting("default_best_quality", "0")) === "1";
  }

  return {
    downloadFolder,
    schedulerEnabled,
    schedulerRetryFailed,
    schedulerDefaultTime,
    notificationsEnabled,
    defaultFormat,
    defaultBestQuality,
    load,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSettingsStore, import.meta.hot));
}
