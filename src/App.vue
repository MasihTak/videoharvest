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
import { getSetting } from "@/services/settings.js";
import { notify } from "@/services/notifications.js";
import { useDownloadsStore } from "@/stores/downloads.js";

const ready = ref(null); // null = checking, true/false = known

async function checkForUpdate() {
  if ((await getSetting("check_on_launch", "1")) !== "1") return;
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
  checkForUpdate();
}

onMounted(async () => {
  useDownloadsStore().load();
  ready.value = await binariesReady();
  if (ready.value) checkForUpdate();
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
