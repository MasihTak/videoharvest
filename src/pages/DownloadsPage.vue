<script setup>
import { onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useDownloadsStore } from "@/stores/downloads.js";
import { humanSize } from "@/utils/formats.js";

const store = useDownloadsStore();
const { items } = storeToRefs(store);

const STATUS_CLASS = {
  pending: "text-bg-secondary",
  downloading: "text-bg-primary",
  completed: "text-bg-success",
  failed: "text-bg-danger",
  canceled: "text-bg-warning",
};

function eta(seconds) {
  if (seconds == null) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

onMounted(() => store.load());
</script>

<template>
  <section>
    <h1 class="h3 mb-3">
      Downloads
    </h1>

    <p
      v-if="!items.length"
      class="text-muted"
    >
      No downloads yet. Pick a format from the Dashboard to start one.
    </p>

    <div
      v-for="item in items"
      :key="item.id"
      class="card mb-3"
    >
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start gap-3 mb-2">
          <div class="min-w-0">
            <h2 class="h6 mb-1 text-truncate">
              {{ item.title || item.url }}
            </h2>
            <span
              v-if="item.format"
              class="text-muted small"
            >
              {{ item.format }}
            </span>
          </div>
          <span
            class="badge"
            :class="STATUS_CLASS[item.status]"
          >
            {{ item.status }}
          </span>
        </div>

        <div
          v-if="item.status === 'downloading'"
          class="progress mb-2"
          role="progressbar"
        >
          <div
            class="progress-bar"
            :style="{ width: item.progress + '%' }"
          >
            {{ Math.round(item.progress) }}%
          </div>
        </div>

        <div class="d-flex justify-content-between align-items-center">
          <span class="text-muted small">
            <template v-if="item.status === 'downloading'">
              {{ humanSize(item.speed) }}/s
              <span v-if="item.eta != null">· ETA {{ eta(item.eta) }}</span>
            </template>
            <template v-else-if="item.location">
              {{ item.location }}
            </template>
          </span>

          <button
            v-if="item.status === 'downloading'"
            type="button"
            class="btn btn-sm btn-outline-danger"
            @click="store.cancel(item.id)"
          >
            Cancel
          </button>
          <button
            v-else
            type="button"
            class="btn btn-sm btn-outline-secondary"
            @click="store.remove(item.id)"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.min-w-0 {
  min-width: 0;
}
</style>
