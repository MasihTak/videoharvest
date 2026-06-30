<script setup>
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

    <TransitionGroup
      name="dl-item"
      tag="div"
    >
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
            :aria-valuenow="Math.round(item.progress)"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div
              class="progress-bar"
              :style="{ transform: `scaleX(${item.progress / 100})` }"
            />
          </div>

          <p
            v-if="item.status === 'failed' && item.error"
            class="text-danger small mb-2 text-break"
          >
            {{ item.error }}
          </p>

          <div class="d-flex justify-content-between align-items-center">
            <span class="text-muted small">
              <template v-if="item.status === 'downloading'">
                {{ Math.round(item.progress) }}%
                <span v-if="item.speed"> · {{ humanSize(item.speed) }}/s</span>
                <span v-if="item.eta != null"> · ETA {{ eta(item.eta) }}</span>
              </template>
              <template v-else-if="item.location">
                {{ item.location }}
              </template>
            </span>

            <div class="d-flex gap-2">
              <button
                v-if="item.status === 'downloading'"
                type="button"
                class="btn btn-sm btn-outline-danger"
                @click="store.cancel(item.id)"
              >
                Cancel
              </button>
              <template v-else>
                <button
                  v-if="
                    (item.status === 'failed' || item.status === 'canceled') &&
                      item.selector &&
                      item.retryable !== false
                  "
                  type="button"
                  class="btn btn-sm btn-outline-primary"
                  @click="store.retry(item.id)"
                >
                  Retry
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary"
                  @click="store.remove(item.id)"
                >
                  Remove
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </TransitionGroup>
  </section>
</template>

<style scoped>
.min-w-0 {
  min-width: 0;
}

.progress-bar {
  width: 100%;
  transform-origin: left center;
  transition: transform 0.3s linear;
}

.dl-item-enter-active {
  transition:
    opacity 200ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 200ms cubic-bezier(0.23, 1, 0.32, 1);
}

.dl-item-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}

.dl-item-move {
  transition: transform 250ms cubic-bezier(0.23, 1, 0.32, 1);
}

@media (prefers-reduced-motion: reduce) {
  .dl-item-enter-active { transition: opacity 150ms ease; }
  .dl-item-enter-from { transform: none; }
  .dl-item-move { transition: none; }
  .progress-bar { transition: none; }
}
</style>
