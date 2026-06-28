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

onMounted(async () => {
  loadVersion();
  checkOnLaunch.value = (await getSetting("check_on_launch", "1")) === "1";
  downloadFolder.value = (await getSetting("download_dir")) ?? (await downloadDir());
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
  </section>
</template>
