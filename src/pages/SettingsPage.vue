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

async function onToggle(key, ref) {
  await setSetting(key, ref.value ? "1" : "0");
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
  <section class="settings">
    <header class="settings-head">
      <h1 class="h3 mb-1">
        Settings
      </h1>
      <p class="text-muted small mb-0">
        Defaults applied to new downloads and scheduled runs.
      </p>
    </header>

    <div class="settings-groups">
      <section class="settings-group">
        <h2 class="settings-group-title">
          Downloads
        </h2>

        <div class="settings-rows">
          <div class="settings-row">
            <div class="settings-row-main">
              <span class="settings-row-label">Download location</span>
              <span
                class="settings-row-desc"
                :title="downloadFolder"
              ><code>{{ downloadFolder }}</code></span>
            </div>
            <button
              type="button"
              class="btn-chip settings-control"
              @click="chooseFolder"
            >
              Choose folder
            </button>
          </div>

          <div class="settings-row">
            <div class="settings-row-main">
              <label
                class="settings-row-label"
                for="defaultFormat"
              >
                Default format
              </label>
            </div>
            <select
              id="defaultFormat"
              v-model="defaultFormat"
              class="form-select form-select-sm settings-control"
              @change="setSetting('default_format', defaultFormat)"
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

          <div class="settings-row">
            <div class="settings-row-main">
              <label
                class="settings-row-label"
                for="defaultBestQuality"
              >
                Always pre-select the best available quality
              </label>
            </div>
            <div class="form-check form-switch mb-0">
              <input
                id="defaultBestQuality"
                v-model="defaultBestQuality"
                class="form-check-input"
                type="checkbox"
                @change="onToggle('default_best_quality', defaultBestQuality)"
              />
            </div>
          </div>
        </div>
      </section>

      <section class="settings-group">
        <h2 class="settings-group-title">
          Scheduler
        </h2>

        <div class="settings-rows">
          <div class="settings-row">
            <div class="settings-row-main">
              <label
                class="settings-row-label"
                for="schedulerEnabled"
              >
                Enable scheduler
              </label>
            </div>
            <div class="form-check form-switch mb-0">
              <input
                id="schedulerEnabled"
                v-model="schedulerEnabled"
                class="form-check-input"
                type="checkbox"
                @change="onToggle('scheduler_enabled', schedulerEnabled)"
              />
            </div>
          </div>

          <div class="settings-row">
            <div class="settings-row-main">
              <label
                class="settings-row-label"
                for="schedulerRetryFailed"
              >
                Retry failed scheduled downloads
              </label>
            </div>
            <div class="form-check form-switch mb-0">
              <input
                id="schedulerRetryFailed"
                v-model="schedulerRetryFailed"
                class="form-check-input"
                type="checkbox"
                @change="onToggle('scheduler_retry_failed', schedulerRetryFailed)"
              />
            </div>
          </div>

          <div class="settings-row">
            <div class="settings-row-main">
              <label
                class="settings-row-label"
                for="schedulerDefaultTime"
              >
                Default schedule time
              </label>
            </div>
            <input
              id="schedulerDefaultTime"
              v-model="schedulerDefaultTime"
              type="time"
              class="form-control form-control-sm settings-control"
              @change="setSetting('scheduler_default_time', schedulerDefaultTime)"
            />
          </div>
        </div>
      </section>

      <section class="settings-group">
        <h2 class="settings-group-title">
          Notifications
        </h2>

        <div class="settings-rows">
          <div class="settings-row">
            <div class="settings-row-main">
              <label
                class="settings-row-label"
                for="notificationsEnabled"
              >
                Notify on download completed, failed, and scheduled start
              </label>
            </div>
            <div class="form-check form-switch mb-0">
              <input
                id="notificationsEnabled"
                v-model="notificationsEnabled"
                class="form-check-input"
                type="checkbox"
                @change="onToggle('notifications_enabled', notificationsEnabled)"
              />
            </div>
          </div>
        </div>
      </section>

      <section class="settings-group">
        <h2 class="settings-group-title">
          yt-dlp
        </h2>

        <div class="settings-rows">
          <div class="settings-row">
            <div class="settings-row-main">
              <span class="settings-row-label">yt-dlp version</span>
              <span class="settings-row-desc"><code>{{ version }}</code></span>
            </div>
            <button
              type="button"
              class="btn-chip btn-chip--primary settings-control"
              :disabled="updating"
              @click="onUpdate"
            >
              {{ updating ? "Updating…" : "Update" }}
            </button>
          </div>

          <div class="settings-row">
            <div class="settings-row-main">
              <label
                class="settings-row-label"
                for="checkOnLaunch"
              >
                Check for yt-dlp updates on launch
              </label>
            </div>
            <div class="form-check form-switch mb-0">
              <input
                id="checkOnLaunch"
                v-model="checkOnLaunch"
                class="form-check-input"
                type="checkbox"
                @change="onToggle('check_on_launch', checkOnLaunch)"
              />
            </div>
          </div>
        </div>

        <pre
          v-if="message"
          class="settings-log"
        >{{ message }}</pre>
      </section>
    </div>
  </section>
</template>

<style scoped>
.settings {
  max-width: 860px;
  margin: 0 auto;
}

.settings-head {
  margin-bottom: 1.75rem;
}

.settings-groups {
  display: flex;
  flex-direction: column;
  gap: 2.25rem;
}

.settings-group-title {
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--vh-ink);
  margin: 0 0 0.6rem;
}

.settings-rows {
  border: 1px solid var(--bs-border-color);
  border-radius: var(--bs-border-radius-lg);
  background: var(--bs-body-bg);
  overflow: hidden;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1.1rem;
}

.settings-row + .settings-row {
  border-top: 1px solid var(--bs-border-color);
}

.settings-row-main {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.settings-row-label {
  font-size: 0.9rem;
  font-weight: 500;
}

.settings-row-desc {
  font-size: 0.8rem;
  color: var(--vh-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.settings-control {
  flex-shrink: 0;
  width: auto;
}

.settings-log {
  margin: 0.75rem 0 0;
  padding: 0.75rem 1rem;
  font-size: 0.8rem;
  background: var(--bs-body-secondary);
  border-radius: var(--bs-border-radius);
}
</style>
