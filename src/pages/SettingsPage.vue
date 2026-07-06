<script setup>
import { onMounted, ref } from "vue";
import { open } from "@tauri-apps/plugin-dialog";
import { downloadDir } from "@tauri-apps/api/path";
import { getYtdlpVersion, updateYtdlp } from "@/services/binaries.js";
import { getSetting, setSetting } from "@/services/settings.js";
import { writeLog } from "@/services/logs.js";
import { notify } from "@/services/notifications.js";

const version = ref("…");
const checkOnLaunch = ref(true);
const updating = ref(false);
const message = ref("");
const downloadFolder = ref("");
const schedulerEnabled = ref(true);
const schedulerRetryFailed = ref(false);
const schedulerDefaultTime = ref("02:00");
const notificationsEnabled = ref(true);
const defaultFormat = ref("full");
const defaultBestQuality = ref(false);

async function chooseFolder() {
  const picked = await open({ directory: true, defaultPath: downloadFolder.value });
  if (picked) {
    downloadFolder.value = picked;
    await setSetting("download_dir", picked);
  }
}

async function loadVersion() {
  try {
    version.value = await getYtdlpVersion();
  } catch {
    version.value = "not installed";
  }
}

async function onUpdate() {
  updating.value = true;
  message.value = "";
  try {
    message.value = await updateYtdlp();
    await loadVersion();
    await writeLog("SUCCESS", "yt-dlp updated.");
    await notify("yt-dlp updated", `Now on ${version.value}.`);
  } catch (e) {
    message.value = String(e);
    await writeLog("ERROR", `yt-dlp update failed: ${e}`);
  } finally {
    updating.value = false;
  }
}

async function onToggleCheck() {
  await setSetting("check_on_launch", checkOnLaunch.value ? "1" : "0");
}

async function onToggleScheduler() {
  await setSetting("scheduler_enabled", schedulerEnabled.value ? "1" : "0");
}

async function onToggleSchedulerRetry() {
  await setSetting("scheduler_retry_failed", schedulerRetryFailed.value ? "1" : "0");
}

async function onChangeSchedulerDefaultTime() {
  await setSetting("scheduler_default_time", schedulerDefaultTime.value);
}

async function onToggleNotifications() {
  await setSetting("notifications_enabled", notificationsEnabled.value ? "1" : "0");
}

async function onChangeDefaultFormat() {
  await setSetting("default_format", defaultFormat.value);
}

async function onToggleDefaultBestQuality() {
  await setSetting("default_best_quality", defaultBestQuality.value ? "1" : "0");
}

onMounted(async () => {
  loadVersion();
  checkOnLaunch.value = (await getSetting("check_on_launch", "1")) === "1";
  downloadFolder.value = (await getSetting("download_dir")) ?? (await downloadDir());
  schedulerEnabled.value = (await getSetting("scheduler_enabled", "1")) === "1";
  schedulerRetryFailed.value = (await getSetting("scheduler_retry_failed", "0")) === "1";
  schedulerDefaultTime.value = await getSetting("scheduler_default_time", "02:00");
  notificationsEnabled.value = (await getSetting("notifications_enabled", "1")) === "1";
  defaultFormat.value = await getSetting("default_format", "full");
  defaultBestQuality.value = (await getSetting("default_best_quality", "0")) === "1";
});
</script>

<template>
  <section>
    <h1 class="h3 mb-3">
      Settings
    </h1>

    <div class="card mb-3">
      <div class="card-body">
        <h2 class="h5 card-title">
          Download location
        </h2>

        <p class="mb-3">
          Files are saved to <code>{{ downloadFolder }}</code>.
        </p>

        <button
          type="button"
          class="btn btn-outline-primary"
          @click="chooseFolder"
        >
          Choose folder
        </button>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <h2 class="h5 card-title">
          Updates
        </h2>

        <p class="mb-3">
          yt-dlp version: <code>{{ version }}</code>
        </p>

        <div class="d-flex align-items-center gap-3 mb-3">
          <button
            type="button"
            class="btn btn-primary"
            :disabled="updating"
            @click="onUpdate"
          >
            {{ updating ? "Updating…" : "Update yt-dlp" }}
          </button>
        </div>

        <div class="form-check form-switch mb-3">
          <input
            id="checkOnLaunch"
            v-model="checkOnLaunch"
            class="form-check-input"
            type="checkbox"
            @change="onToggleCheck"
          />
          <label
            class="form-check-label"
            for="checkOnLaunch"
          >
            Check for yt-dlp updates on launch
          </label>
        </div>

        <pre
          v-if="message"
          class="bg-body-secondary p-3 rounded small mb-0"
        >{{ message }}</pre>
      </div>
    </div>

    <div class="card mt-3">
      <div class="card-body">
        <h2 class="h5 card-title">
          Scheduler
        </h2>

        <div class="form-check form-switch mb-3">
          <input
            id="schedulerEnabled"
            v-model="schedulerEnabled"
            class="form-check-input"
            type="checkbox"
            @change="onToggleScheduler"
          />
          <label
            class="form-check-label"
            for="schedulerEnabled"
          >
            Enable scheduler
          </label>
        </div>

        <div class="form-check form-switch mb-3">
          <input
            id="schedulerRetryFailed"
            v-model="schedulerRetryFailed"
            class="form-check-input"
            type="checkbox"
            @change="onToggleSchedulerRetry"
          />
          <label
            class="form-check-label"
            for="schedulerRetryFailed"
          >
            Retry failed scheduled downloads
          </label>
        </div>

        <div>
          <label
            class="form-label small"
            for="schedulerDefaultTime"
          >
            Default schedule time
          </label>
          <input
            id="schedulerDefaultTime"
            v-model="schedulerDefaultTime"
            type="time"
            class="form-control form-control-sm w-auto"
            @change="onChangeSchedulerDefaultTime"
          />
        </div>
      </div>
    </div>

    <div class="card mt-3">
      <div class="card-body">
        <h2 class="h5 card-title">
          Downloads
        </h2>

        <div class="mb-3">
          <label
            class="form-label small"
            for="defaultFormat"
          >
            Default format
          </label>
          <select
            id="defaultFormat"
            v-model="defaultFormat"
            class="form-select form-select-sm w-auto"
            @change="onChangeDefaultFormat"
          >
            <option value="full">
              Full video
            </option>
            <option value="video">
              Video only
            </option>
            <option value="audio">
              Audio only
            </option>
          </select>
        </div>

        <div class="form-check form-switch mb-0">
          <input
            id="defaultBestQuality"
            v-model="defaultBestQuality"
            class="form-check-input"
            type="checkbox"
            @change="onToggleDefaultBestQuality"
          />
          <label
            class="form-check-label"
            for="defaultBestQuality"
          >
            Always pre-select the best available quality
          </label>
        </div>
      </div>
    </div>

    <div class="card mt-3">
      <div class="card-body">
        <h2 class="h5 card-title">
          Notifications
        </h2>

        <div class="form-check form-switch mb-0">
          <input
            id="notificationsEnabled"
            v-model="notificationsEnabled"
            class="form-check-input"
            type="checkbox"
            @change="onToggleNotifications"
          />
          <label
            class="form-check-label"
            for="notificationsEnabled"
          >
            Notify on download completed, failed, and scheduled start
          </label>
        </div>
      </div>
    </div>
  </section>
</template>
