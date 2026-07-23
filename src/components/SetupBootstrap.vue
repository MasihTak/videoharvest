<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { bootstrapBinaries, onBootstrapProgress } from "@/services/binaries.js";

const emit = defineEmits(["ready"]);

const status = ref("Downloading components…");
const file = ref("");
const percent = ref(0);
const error = ref("");
let unlisten = null;

async function run() {
  error.value = "";
  percent.value = 0;
  status.value = "Downloading components…";
  try {
    await bootstrapBinaries();
    emit("ready");
  } catch (e) {
    error.value = String(e);
  }
}

onMounted(async () => {
  unlisten = await onBootstrapProgress((p) => {
    file.value = p.file;
    percent.value = p.total ? Math.round((p.received / p.total) * 100) : 0;
  });
  await run();
});

onUnmounted(() => unlisten?.());
</script>

<template>
  <div class="setup d-flex flex-column align-items-center justify-content-center text-center p-4">
    <h1 class="h4 mb-2">
      Setting up VideoHarvest
    </h1>
    <p class="text-muted mb-4">
      Downloading yt-dlp and ffmpeg. This happens once.
    </p>

    <div
      v-if="error"
      class="w-100"
      style="max-width: 420px"
    >
      <div
        class="alert alert-danger"
        role="alert"
      >
        {{ error }}
      </div>
      <button
        type="button"
        class="btn btn-primary"
        @click="run"
      >
        Retry
      </button>
    </div>

    <div
      v-else
      class="w-100"
      style="max-width: 420px"
    >
      <div class="progress mb-2">
        <div
          class="progress-bar progress-bar-striped progress-bar-animated"
          :style="{ width: percent + '%' }"
        />
      </div>
      <p class="small text-muted mb-0">
        {{ file ? `${file} — ${percent}%` : status }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.setup {
  min-height: 100vh;
}
</style>
