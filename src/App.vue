<script setup>
import { onMounted, ref } from "vue";
import { RouterView } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import SetupBootstrap from "@/components/SetupBootstrap.vue";
import {
  binariesReady,
  checkLatestYtdlp,
  getYtdlpVersion,
} from "@/services/binaries.js";
import { notify } from "@/services/notifications.js";
import { useDownloadsStore } from "@/stores/downloads.js";
import { useSchedulerStore } from "@/stores/scheduler.js";
import { useSettingsStore } from "@/stores/settings.js";

const ready = ref(null); // null = checking, true/false = known

async function checkForUpdate() {
  try {
    const [installed, latest] = await Promise.all([
      getYtdlpVersion(),
      checkLatestYtdlp(),
    ]);
    if (latest && installed && latest !== installed) {
      await notify("yt-dlp update available", `Version ${latest} is ready to install.`);
    }
  } catch {
    // Offline or GitHub unreachable — silent, it's only a courtesy check.
  }
}

async function onReady() {
  ready.value = true;
  await checkForUpdate();
}

onMounted(async () => {
  await Promise.all([useDownloadsStore().load(), useSettingsStore().load()]);
  useSchedulerStore().startPolling();
  // A failed check means the binaries aren't usable — fall through to the setup flow.
  ready.value = await binariesReady().catch(() => false);
  if (ready.value) await checkForUpdate();
});
</script>

<template>
  <SetupBootstrap
    v-if="ready === false"
    @ready="onReady"
  />
  <DefaultLayout v-else-if="ready">
    <RouterView />
  </DefaultLayout>
</template>
