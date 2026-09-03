<script setup>
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { openPath, revealItemInDir } from "@tauri-apps/plugin-opener";
import { useDownloadsStore } from "@/stores/downloads.js";
import { writeLog } from "@/services/logs.js";
import { humanSize } from "@/utils/formats.js";

const store = useDownloadsStore();
const { items } = storeToRefs(store);

// Newest on top; store keeps oldest-first to preserve FIFO queue order.
// Playlist entries render nested inside their own card, not in this flat list.
const standaloneItems = computed(() =>
  [...items.value].filter((it) => !it.playlistId).reverse(),
);

// Which playlist cards are expanded to show their per-video rows.
const expandedPlaylists = ref(new Set());

function togglePlaylist(id) {
  const next = new Set(expandedPlaylists.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  expandedPlaylists.value = next;
}

// Every status icon shares the same 20x20/stroke-2 svg shell — only the
// circle-outline presence and inner path(s) vary per status.
const STATUS = {
  pending: { label: "Queued", tone: "neutral", circle: true, paths: ["M12 7v5l3 2"] },
  downloading: { label: "Downloading", tone: "active", spin: true, paths: ["M12 3a9 9 0 1 0 9 9"] },
  completed: { label: "Completed", tone: "success", paths: ["M20 6 9 17l-5-5"] },
  failed: { label: "Failed", tone: "danger", circle: true, paths: ["M12 8v5m0 3h.01"] },
  canceled: { label: "Canceled", tone: "muted", circle: true, paths: ["M15 9l-6 6m0-6 6 6"] },
};

const summary = computed(() => {
  const counts = items.value
    .filter((it) => !it.playlistId)
    .reduce((acc, it) => {
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

// An item nobody will work on again — completed, failed or canceled. It owns
// its full share of the playlist bar regardless of how far its bytes got.
const SETTLED = ["completed", "failed", "canceled"];

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
    .map((g) => {
      const total = g.items.length;
      const done = g.items.filter((it) => it.status === "completed").length;
      const failed = g.items.filter((it) => it.status === "failed").length;
      return {
        ...g,
        total,
        done,
        failed,
        summary: `${done}/${total} complete${failed ? ` · ${failed} failed` : ""}`,
        running: g.items.some((it) => it.status === "downloading" || it.status === "pending"),
        // Measures work left, not bytes fetched — so it never runs backwards when
        // yt-dlp restarts at 0% for the audio stream, and always lands on 100%.
        percent: Math.round(
          g.items.reduce(
            (sum, it) => sum + (SETTLED.includes(it.status) ? 100 : it.progress),
            0,
          ) / total,
        ),
      };
    })
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

function clock(seconds) {
  if (seconds == null) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// A clipped download is otherwise indistinguishable from a full one in history.
function clipRange(item) {
  if (item.sectionStart == null && item.sectionEnd == null) return null;
  if (item.sectionEnd == null) return `from ${clock(item.sectionStart)}`;
  if (item.sectionStart == null) return `to ${clock(item.sectionEnd)}`;
  return `${clock(item.sectionStart)}–${clock(item.sectionEnd)}`;
}

// The file can be gone or the path unopenable — log it instead of failing
// silently, so a dead button leaves a trace on the Logs page.
async function openFile(item) {
  if (!item.location) return;
  try {
    await openPath(item.location);
  } catch (error) {
    await writeLog("ERROR", `Could not open ${item.location}: ${error}`);
  }
}

async function showInFolder(item) {
  if (!item.location) return;
  try {
    await revealItemInDir(item.location);
  } catch (error) {
    await writeLog("ERROR", `Could not reveal ${item.location}: ${error}`);
  }
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
    <header
      v-if="summary || retryableFailed.length || completedItems.length"
      class="downloads-head"
    >
      <p
        v-if="summary"
        class="text-muted small mb-0"
      >
        {{ summary }}
      </p>

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
        class="playlist-group-wrap"
        :class="{ 'is-expanded': expandedPlaylists.has(g.id) }"
      >
        <div
          v-if="!expandedPlaylists.has(g.id)"
          class="playlist-stack playlist-stack--back"
          aria-hidden="true"
        />
        <div
          v-if="!expandedPlaylists.has(g.id)"
          class="playlist-stack playlist-stack--mid"
          aria-hidden="true"
        />

        <div class="playlist-card">
          <button
            type="button"
            class="playlist-toggle"
            :aria-expanded="expandedPlaylists.has(g.id)"
            @click="togglePlaylist(g.id)"
          >
            <span class="playlist-icon">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect
                  x="7"
                  y="3"
                  width="14"
                  height="10"
                  rx="2"
                />
                <path d="M3 8v10a2 2 0 0 0 2 2h10" />
              </svg>
            </span>

            <span class="playlist-body">
              <span class="playlist-title-line">
                <span
                  class="playlist-title"
                  :title="g.title"
                >{{ g.title || "Playlist" }}</span>
                <span class="playlist-count">{{ g.summary }}</span>
              </span>
              <span class="dl-progress">
                <span
                  class="dl-progress-bar"
                  :style="{ transform: `scaleX(${g.percent / 100})` }"
                />
              </span>
            </span>

            <span
              class="playlist-chevron"
              :class="{ 'is-open': expandedPlaylists.has(g.id) }"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          </button>

          <ul
            v-if="expandedPlaylists.has(g.id)"
            class="playlist-videos"
          >
            <li
              v-for="v in g.items"
              :key="v.id"
              class="playlist-video"
            >
              <span
                class="dl-status plv-status"
                :class="`dl-status--${STATUS[v.status].tone}`"
                aria-hidden="true"
              >
                <svg
                  :class="{ 'dl-spinner': STATUS[v.status].spin }"
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle
                    v-if="STATUS[v.status].circle"
                    cx="12"
                    cy="12"
                    r="9"
                  />
                  <path
                    v-for="d in STATUS[v.status].paths"
                    :key="d"
                    :d="d"
                  />
                </svg>
              </span>

              <div class="plv-main">
                <p
                  class="plv-title"
                  :title="v.title || v.url"
                >
                  {{ v.title || v.url }}
                </p>
                <p
                  v-if="v.status === 'downloading'"
                  class="plv-meta"
                >
                  <span class="dl-meta-strong">{{ Math.round(v.progress) }}%</span>
                  <span v-if="v.speed"> · {{ humanSize(v.speed) }}/s</span>
                  <span v-if="v.eta != null"> · ETA {{ clock(v.eta) }}</span>
                </p>
                <p
                  v-else-if="v.status === 'failed' && v.error"
                  class="plv-meta plv-meta--error"
                  :title="v.errorRaw || v.error"
                >
                  {{ v.error }}
                </p>
              </div>

              <span
                class="dl-label"
                :class="`dl-label--${STATUS[v.status].tone}`"
              >
                {{ STATUS[v.status].label }}
              </span>

              <div class="plv-actions">
                <button
                  v-if="v.status === 'downloading'"
                  type="button"
                  class="plv-act plv-act--cancel"
                  aria-label="Cancel"
                  title="Cancel"
                  @click="store.cancel(v.id)"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="13"
                    height="13"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect
                      x="6"
                      y="6"
                      width="12"
                      height="12"
                      rx="1.5"
                    />
                  </svg>
                </button>
                <button
                  v-if="canRetry(v)"
                  type="button"
                  class="plv-act plv-act--retry"
                  aria-label="Retry"
                  title="Retry"
                  @click="store.retry(v.id)"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="13"
                    height="13"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M21 12a9 9 0 1 1-2.6-6.4" />
                    <path d="M21 3v6h-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="plv-act plv-act--dismiss"
                  aria-label="Remove from list"
                  title="Remove"
                  @click="store.remove(v.id)"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="13"
                    height="13"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </li>
          </ul>
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
      v-else-if="standaloneItems.length"
      name="dl-item"
      tag="ul"
      class="dl-list"
    >
      <li
        v-for="item in standaloneItems"
        :key="item.id"
        class="dl-row"
      >
        <span
          class="dl-status"
          :class="`dl-status--${STATUS[item.status].tone}`"
          aria-hidden="true"
        >
          <svg
            :class="{ 'dl-spinner': STATUS[item.status].spin }"
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
              v-if="STATUS[item.status].circle"
              cx="12"
              cy="12"
              r="9"
            />
            <path
              v-for="d in STATUS[item.status].paths"
              :key="d"
              :d="d"
            />
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
              v-if="clipRange(item)"
              class="dl-clip"
              title="Only this part of the video was downloaded"
            >
              {{ clipRange(item) }}
            </span>
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
              <span v-if="item.eta != null"> · ETA {{ clock(item.eta) }}</span>
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
  margin-left: auto;
}

.playlist-groups {
  list-style: none;
  margin: 0 0 1rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* A collapsed playlist fans two faint layers out behind its header so the
   batch reads as a stack; the extra bottom margin gives them room to peek. */
.playlist-group-wrap {
  position: relative;
  margin-bottom: 0.625rem;
}

.playlist-group-wrap.is-expanded {
  margin-bottom: 0;
}

.playlist-stack {
  position: absolute;
  border: 1px solid var(--bs-border-color);
  border-radius: var(--bs-border-radius-lg);
  pointer-events: none;
}

.playlist-stack--back {
  left: 12px;
  right: 12px;
  top: 8px;
  bottom: -8px;
  background: color-mix(in oklch, var(--bs-body-bg) 60%, var(--vh-surface));
  z-index: 0;
}

.playlist-stack--mid {
  left: 6px;
  right: 6px;
  top: 4px;
  bottom: -4px;
  background: color-mix(in oklch, var(--bs-body-bg) 82%, var(--vh-surface));
  z-index: 1;
}

.playlist-card {
  position: relative;
  z-index: 2;
  border: 1px solid var(--bs-border-color);
  border-radius: var(--bs-border-radius-lg);
  background: var(--bs-body-bg);
  overflow: hidden;
  box-shadow: 0 1px 2px oklch(0.18 0.014 25 / 0.04);
}

.playlist-toggle {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  width: 100%;
  padding: 0.875rem 1.125rem;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.playlist-toggle:focus-visible {
  outline: 2px solid var(--vh-primary);
  outline-offset: -2px;
}

.playlist-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 10px;
  color: var(--vh-muted);
  background: var(--bs-secondary-bg);
}

.playlist-body {
  flex: 1;
  min-width: 0;
}

.playlist-title-line {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.playlist-title {
  flex: 1;
  min-width: 0;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist-count {
  flex-shrink: 0;
  font-size: 0.75rem;
  color: var(--vh-muted);
}

.dl-progress {
  display: block;
}

.playlist-chevron {
  flex-shrink: 0;
  display: flex;
  color: var(--vh-muted);
  transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1);
}

.playlist-chevron.is-open {
  transform: rotate(180deg);
}

.playlist-videos {
  list-style: none;
  margin: 0;
  padding: 0;
}

.playlist-video {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.7rem 1.125rem 0.7rem 3.25rem;
  border-top: 1px solid var(--bs-border-color);
}

.plv-status {
  width: 28px;
  height: 28px;
  border-radius: 8px;
}

.plv-main {
  flex: 1;
  min-width: 0;
}

.plv-title {
  margin: 0;
  font-size: 0.84rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.plv-meta {
  margin: 0.15rem 0 0;
  font-size: 0.72rem;
  color: var(--vh-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.plv-meta--error {
  color: var(--dl-danger);
  white-space: normal;
  overflow-wrap: anywhere;
}

.plv-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.plv-act {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: transparent;
  cursor: pointer;
  transition: background-color 0.15s cubic-bezier(0.25, 1, 0.5, 1),
    color 0.15s cubic-bezier(0.25, 1, 0.5, 1);
}

.plv-act:focus-visible {
  outline: 2px solid var(--vh-primary);
  outline-offset: 1px;
}

.plv-act--cancel {
  color: var(--vh-primary);
  border: 1px solid color-mix(in oklch, var(--vh-primary) 35%, transparent);
}

.plv-act--cancel:hover {
  color: var(--vh-primary-text);
  background: var(--vh-primary);
}

.plv-act--retry {
  color: var(--vh-primary-text);
  background: var(--vh-primary);
  border: 1px solid var(--vh-primary);
}

.plv-act--retry:hover {
  background: color-mix(in oklch, var(--vh-primary), black 12%);
}

.plv-act--dismiss {
  color: var(--vh-muted);
  border: 1px solid var(--bs-border-color);
}

.plv-act--dismiss:hover {
  color: var(--vh-ink);
  background: var(--bs-secondary-bg);
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

.dl-clip {
  flex-shrink: 0;
  font-size: 0.75rem;
  color: var(--vh-muted);
  font-variant-numeric: tabular-nums;
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
  --dl-danger: oklch(0.52 0.13 25);
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

  .playlist-chevron {
    transition: none;
  }
}
</style>
