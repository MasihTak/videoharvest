<script setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { openPath, revealItemInDir } from "@tauri-apps/plugin-opener";
import { useDownloadsStore } from "@/stores/downloads.js";
import { humanSize } from "@/utils/formats.js";

const store = useDownloadsStore();
const { items } = storeToRefs(store);

// Newest on top; store keeps oldest-first to preserve FIFO queue order.
const orderedItems = computed(() => [...items.value].reverse());

const STATUS = {
  pending: { label: "Queued", tone: "neutral" },
  downloading: { label: "Downloading", tone: "active" },
  completed: { label: "Completed", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
  canceled: { label: "Canceled", tone: "muted" },
};

const summary = computed(() => {
  const counts = items.value.reduce((acc, it) => {
    acc[it.status] = (acc[it.status] ?? 0) + 1;
    return acc;
  }, {});
  const parts = [];
  if (counts.downloading) parts.push(`${counts.downloading} downloading`);
  if (counts.pending) parts.push(`${counts.pending} queued`);
  if (counts.completed) parts.push(`${counts.completed} completed`);
  if (counts.failed) parts.push(`${counts.failed} failed`);
  return parts.join(" · ");
});

const completedItems = computed(() =>
  items.value.filter((it) => it.status === "completed"),
);

// One aggregate row per playlist batch — rolls up all its item rows, which
// already render individually below with their own per-video progress.
const playlistGroups = computed(() => {
  const groups = new Map();
  for (const it of items.value) {
    if (!it.playlistId) continue;
    if (!groups.has(it.playlistId)) {
      groups.set(it.playlistId, { id: it.playlistId, title: it.playlistTitle, items: [] });
    }
    groups.get(it.playlistId).items.push(it);
  }
  return [...groups.values()]
    .map((g) => ({
      ...g,
      total: g.items.length,
      done: g.items.filter((it) => it.status === "completed").length,
      failed: g.items.filter((it) => it.status === "failed").length,
      percent: Math.round(g.items.reduce((sum, it) => sum + it.progress, 0) / g.items.length),
    }))
    .reverse();
});
const retryableFailed = computed(() =>
  items.value.filter(
    (it) => it.status === "failed" && it.selector && it.retryable !== false,
  ),
);

// Bulk actions route through the same per-item store flow, one id at a time.
function retryAllFailed() {
  for (const it of retryableFailed.value) store.retry(it.id);
}

function clearCompleted() {
  for (const it of completedItems.value) store.remove(it.id);
}

function fileName(path) {
  return path ? path.split(/[\\/]/).pop() : "";
}

function eta(seconds) {
  if (seconds == null) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function openFile(item) {
  if (!item.location) return;
  try {
    await openPath(item.location);
  } catch { /* file gone */ }
}

async function showInFolder(item) {
  if (!item.location) return;
  try {
    await revealItemInDir(item.location);
  } catch { /* file gone */ }
}

function canRetry(item) {
  return (
    (item.status === "failed" || item.status === "canceled") &&
    item.selector &&
    item.retryable !== false
  );
}
</script>

<template>
  <section class="downloads">
    <header class="downloads-head">
      <div>
        <h1 class="h3 mb-1">
          Downloads
        </h1>
        <p
          v-if="summary"
          class="text-muted small mb-0"
        >
          {{ summary }}
        </p>
      </div>

      <div
        v-if="retryableFailed.length || completedItems.length"
        class="downloads-actions"
      >
        <button
          v-if="retryableFailed.length"
          type="button"
          class="btn-chip"
          @click="retryAllFailed"
        >
          Retry all failed
        </button>
        <button
          v-if="completedItems.length"
          type="button"
          class="btn-chip"
          @click="clearCompleted"
        >
          Clear completed
        </button>
      </div>
    </header>

    <ul
      v-if="playlistGroups.length"
      class="playlist-groups"
    >
      <li
        v-for="g in playlistGroups"
        :key="g.id"
        class="playlist-group"
      >
        <div class="playlist-group-head">
          <span
            class="playlist-group-title"
            :title="g.title"
          >{{ g.title || "Playlist" }}</span>
          <span class="playlist-group-count">
            {{ g.done }}/{{ g.total }} complete<template v-if="g.failed"> · {{ g.failed }} failed</template>
          </span>
        </div>
        <div class="dl-progress">
          <div
            class="dl-progress-bar"
            :style="{ transform: `scaleX(${g.percent / 100})` }"
          />
        </div>
      </li>
    </ul>

    <div
      v-if="!items.length"
      class="empty-state"
    >
      <span class="empty-state-icon">
        <svg
          viewBox="0 0 24 24"
          width="26"
          height="26"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
          <path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" />
        </svg>
      </span>
      <h2 class="h6 mb-1">
        No downloads yet
      </h2>
      <p class="text-muted small mb-0">
        Paste a link on the Dashboard and pick a format to start one.
      </p>
    </div>

    <TransitionGroup
      v-else
      name="dl-item"
      tag="ul"
      class="dl-list"
    >
      <li
        v-for="item in orderedItems"
        :key="item.id"
        class="dl-row"
      >
        <span
          class="dl-status"
          :class="`dl-status--${STATUS[item.status].tone}`"
          aria-hidden="true"
        >
          <svg
            v-if="item.status === 'downloading'"
            class="dl-spinner"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          >
            <path d="M12 3a9 9 0 1 0 9 9" />
          </svg>
          <svg
            v-else-if="item.status === 'completed'"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <svg
            v-else-if="item.status === 'failed'"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
            />
            <path d="M12 8v5m0 3h.01" />
          </svg>
          <svg
            v-else-if="item.status === 'canceled'"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
            />
            <path d="M15 9l-6 6m0-6 6 6" />
          </svg>
          <svg
            v-else
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
            />
            <path d="M12 7v5l3 2" />
          </svg>
        </span>

        <div class="dl-main">
          <div class="dl-title-line">
            <p
              class="dl-title"
              :title="item.title || item.url"
            >
              {{ item.title || item.url }}
            </p>
            <span
              class="dl-label"
              :class="`dl-label--${STATUS[item.status].tone}`"
            >
              {{ STATUS[item.status].label }}
            </span>
          </div>

          <div
            v-if="item.status === 'downloading'"
            class="dl-progress"
            role="progressbar"
            :aria-valuenow="Math.round(item.progress)"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="`${Math.round(item.progress)}% downloaded`"
          >
            <div
              class="dl-progress-bar"
              :style="{ transform: `scaleX(${item.progress / 100})` }"
            />
          </div>

          <p
            class="dl-meta"
            :class="{ 'dl-meta--error': item.status === 'failed' && item.error }"
          >
            <template v-if="item.status === 'downloading'">
              <span class="dl-meta-strong">{{ Math.round(item.progress) }}%</span>
              <span v-if="item.speed"> · {{ humanSize(item.speed) }}/s</span>
              <span v-if="item.eta != null"> · ETA {{ eta(item.eta) }}</span>
            </template>
            <template v-else-if="item.status === 'failed' && item.error">
              <span
                class="dl-meta-error"
                :title="item.errorRaw || item.error"
              >{{ item.error }}</span>
            </template>
            <template v-else-if="item.location">
              <span
                class="dl-path"
                :title="item.location"
              >{{ fileName(item.location) }}</span>
            </template>
            <template v-else-if="item.format">
              {{ item.format }}
            </template>
          </p>
        </div>

        <div class="dl-actions">
          <button
            v-if="item.status === 'downloading'"
            type="button"
            class="btn-chip btn-chip--danger"
            @click="store.cancel(item.id)"
          >
            Cancel
          </button>

          <template v-else>
            <template v-if="item.status === 'completed' && item.location">
              <button
                type="button"
                class="btn-chip btn-chip--primary"
                @click="openFile(item)"
              >
                Open
              </button>
              <button
                type="button"
                class="btn-chip"
                @click="showInFolder(item)"
              >
                Show in folder
              </button>
            </template>

            <button
              v-if="canRetry(item)"
              type="button"
              class="btn-chip btn-chip--primary"
              @click="store.retry(item.id)"
            >
              Retry
            </button>

            <button
              type="button"
              class="btn-chip btn-chip--icon"
              aria-label="Remove from list"
              title="Remove"
              @click="store.remove(item.id)"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </template>
        </div>
      </li>
    </TransitionGroup>
  </section>
</template>

<style scoped>
.downloads {
  max-width: 860px;
  margin: 0 auto;
}

.downloads-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}

.downloads-actions {
  display: flex;
  flex-shrink: 0;
  gap: 0.4rem;
}

.playlist-groups {
  list-style: none;
  margin: 0 0 1rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.playlist-group {
  padding: 0.75rem 1rem;
  border: 1px solid var(--bs-border-color);
  border-radius: var(--bs-border-radius-lg);
  background: var(--bs-body-bg);
}

.playlist-group-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}

.playlist-group-title {
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist-group-count {
  flex-shrink: 0;
  font-size: 0.75rem;
  color: var(--vh-muted);
}

.dl-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid var(--bs-border-color);
  border-radius: var(--bs-border-radius-lg);
  background: var(--bs-body-bg);
  overflow: hidden;
}

.dl-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 1.1rem;
}

.dl-row + .dl-row {
  border-top: 1px solid var(--bs-border-color);
}

/* Status glyph — calm neutral tile by default; color earns meaning. */
.dl-status {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  color: var(--vh-muted);
  background: var(--bs-secondary-bg);
}

.dl-status--active {
  color: var(--vh-primary);
  background: color-mix(in oklch, var(--vh-primary) 10%, transparent);
}

.dl-status--success {
  color: var(--dl-success);
  background: color-mix(in oklch, var(--dl-success) 12%, transparent);
}

.dl-status--danger {
  color: var(--dl-danger);
  background: color-mix(in oklch, var(--dl-danger) 14%, transparent);
}

.dl-main {
  flex: 1;
  min-width: 0;
}

.dl-title-line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}

.dl-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dl-label {
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--vh-muted);
}

.dl-label--active {
  color: var(--vh-primary);
}

.dl-label--success {
  color: var(--dl-success);
}

.dl-label--danger {
  color: var(--dl-danger);
}

.dl-meta {
  font-size: 0.8rem;
  color: var(--vh-muted);
  margin: 0.3rem 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dl-meta-strong {
  color: var(--vh-ink);
  font-weight: 600;
}

.dl-meta-error {
  color: var(--dl-danger);
}

/* Let a failure reason breathe: wrap up to three lines instead of clipping to
   one. The full raw yt-dlp line stays available on hover. */
.dl-meta--error {
  white-space: normal;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
}

.dl-path {
  font-variant-numeric: tabular-nums;
}

.dl-progress {
  height: 5px;
  margin: 0.55rem 0 0.1rem;
  background: var(--bs-secondary-bg);
  border-radius: 999px;
  overflow: hidden;
}

.dl-progress-bar {
  width: 100%;
  height: 100%;
  background: var(--vh-primary);
  transform-origin: left center;
  transform: scaleX(0);
  transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  border-radius: 999px;
}

.dl-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.downloads {
  --dl-success: oklch(0.52 0.13 150);
  --dl-danger: oklch(0.52 0.13 65);
}

.dl-spinner {
  animation: dl-spin 0.8s linear infinite;
}

@keyframes dl-spin {
  to {
    transform: rotate(360deg);
  }
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

.dl-item-leave-active {
  transition:
    opacity 160ms ease,
    transform 160ms ease;
  position: absolute;
  width: 100%;
}

.dl-item-leave-to {
  opacity: 0;
  transform: translateX(8px);
}

.dl-item-move {
  transition: transform 250ms cubic-bezier(0.23, 1, 0.32, 1);
}

@media (prefers-reduced-motion: reduce) {
  .dl-item-enter-active,
  .dl-item-leave-active,
  .dl-item-move {
    transition: opacity 150ms ease;
  }

  .dl-item-enter-from {
    transform: none;
  }

  .dl-spinner {
    animation-duration: 1.6s;
  }

  .dl-progress-bar {
    transition: none;
  }
}
</style>
