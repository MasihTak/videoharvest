<script setup>
import { computed, onMounted, ref } from "vue";
import { getLogs, clearLogs } from "@/services/logs.js";

// Level → display tone. Unknown levels fall back to INFO styling.
const LEVELS = {
  INFO: { label: "Info", tone: "info" },
  SUCCESS: { label: "Success", tone: "success" },
  WARNING: { label: "Warning", tone: "warning" },
  ERROR: { label: "Error", tone: "danger" },
};

const logs = ref([]);
const loading = ref(true);
const filter = ref("ALL");

const counts = computed(() => {
  const acc = { ALL: logs.value.length };
  for (const log of logs.value) acc[log.level] = (acc[log.level] ?? 0) + 1;
  return acc;
});

const visible = computed(() =>
  filter.value === "ALL" ? logs.value : logs.value.filter((l) => l.level === filter.value),
);

function tone(level) {
  return (LEVELS[level] ?? LEVELS.INFO).tone;
}

function label(level) {
  return (LEVELS[level] ?? LEVELS.INFO).label;
}

// SQLite stores CURRENT_TIMESTAMP as naive UTC ("YYYY-MM-DD HH:MM:SS").
function when(createdAt) {
  if (!createdAt) return "";
  const d = new Date(`${createdAt.replace(" ", "T")}Z`);
  return Number.isNaN(d.getTime()) ? createdAt : d.toLocaleString();
}

async function load() {
  loading.value = true;
  try {
    logs.value = await getLogs();
  } finally {
    loading.value = false;
  }
}

async function clear() {
  await clearLogs();
  logs.value = [];
  filter.value = "ALL";
}

onMounted(load);
</script>

<template>
  <section class="logs">
    <header class="logs-head">
      <h1 class="h3 mb-0">
        Logs
      </h1>
      <div class="logs-head-actions">
        <button
          type="button"
          class="btn-chip"
          :disabled="loading"
          @click="load"
        >
          Refresh
        </button>
        <button
          type="button"
          class="btn-chip btn-chip--danger"
          :disabled="loading || !logs.length"
          @click="clear"
        >
          Clear all
        </button>
      </div>
    </header>

    <div
      v-if="logs.length"
      class="logs-filters"
    >
      <button
        v-for="level in ['ALL', 'INFO', 'SUCCESS', 'WARNING', 'ERROR']"
        :key="level"
        type="button"
        class="logs-chip"
        :class="{ 'logs-chip--active': filter === level }"
        :disabled="level !== 'ALL' && !counts[level]"
        @click="filter = level"
      >
        {{ level === 'ALL' ? 'All' : label(level) }}
        <span class="logs-chip-count">{{ counts[level] ?? 0 }}</span>
      </button>
    </div>

    <div
      v-if="!loading && !logs.length"
      class="logs-empty"
    >
      <h2 class="h6 mb-1">
        No logs yet
      </h2>
      <p class="text-muted small mb-0">
        Activity like updates and downloads will appear here.
      </p>
    </div>

    <ul
      v-else
      class="logs-list"
    >
      <li
        v-for="log in visible"
        :key="log.id"
        class="logs-row"
        :class="`logs-row--${tone(log.level)}`"
      >
        <span
          class="logs-badge"
          :class="`logs-badge--${tone(log.level)}`"
        >
          {{ label(log.level) }}
        </span>
        <span class="logs-message">{{ log.message }}</span>
        <time class="logs-time">{{ when(log.created_at) }}</time>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.logs {
  max-width: 860px;
  margin: 0 auto;

  --log-info: var(--vh-muted);
  --log-success: oklch(0.52 0.13 150);
  --log-warning: oklch(0.62 0.14 75);
  --log-danger: oklch(0.52 0.13 25);
}

.logs-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.logs-head-actions {
  display: flex;
  gap: 0.4rem;
}

.logs-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1rem;
}

.logs-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  height: 30px;
  padding: 0 0.7rem;
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--vh-muted);
  background: transparent;
  border: 1px solid var(--bs-border-color);
  border-radius: 999px;
  transition: background-color 0.15s cubic-bezier(0.25, 1, 0.5, 1),
    color 0.15s cubic-bezier(0.25, 1, 0.5, 1),
    border-color 0.15s cubic-bezier(0.25, 1, 0.5, 1);
}

.logs-chip:hover:not(:disabled) {
  color: var(--vh-ink);
  background: var(--bs-secondary-bg);
}

.logs-chip:disabled {
  opacity: 0.45;
}

.logs-chip--active {
  color: var(--vh-primary-text);
  background: var(--vh-primary);
  border-color: var(--vh-primary);
}

.logs-chip:focus-visible {
  outline: 2px solid var(--vh-primary);
  outline-offset: 2px;
}

.logs-chip-count {
  font-variant-numeric: tabular-nums;
  font-size: 0.72rem;
  opacity: 0.75;
}

.logs-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid var(--bs-border-color);
  border-radius: var(--bs-border-radius-lg);
  background: var(--bs-body-bg);
  overflow: hidden;
}

.logs-row {
  display: flex;
  align-items: baseline;
  gap: 0.85rem;
  padding: 0.7rem 1.1rem;
  border-left: 3px solid transparent;
}

.logs-row + .logs-row {
  border-top: 1px solid var(--bs-border-color);
}

.logs-row--info {
  border-left-color: var(--log-info);
}

.logs-row--success {
  border-left-color: var(--log-success);
}

.logs-row--warning {
  border-left-color: var(--log-warning);
}

.logs-row--danger {
  border-left-color: var(--log-danger);
}

.logs-badge {
  flex-shrink: 0;
  width: 64px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.logs-badge--info {
  color: var(--log-info);
}

.logs-badge--success {
  color: var(--log-success);
}

.logs-badge--warning {
  color: var(--log-warning);
}

.logs-badge--danger {
  color: var(--log-danger);
}

.logs-message {
  flex: 1;
  min-width: 0;
  font-size: 0.85rem;
  color: var(--vh-ink);
  overflow-wrap: anywhere;
}

.logs-time {
  flex-shrink: 0;
  font-size: 0.75rem;
  color: var(--vh-muted);
  font-variant-numeric: tabular-nums;
}

.logs-empty {
  text-align: center;
  padding: 3.5rem 1.5rem;
  border: 1px dashed var(--bs-border-color);
  border-radius: var(--bs-border-radius-lg);
}
</style>
