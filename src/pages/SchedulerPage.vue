<script setup>
import { onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useSchedulerStore } from "@/stores/scheduler.js";
import { formatCountdown } from "@/services/scheduler.js";

const scheduler = useSchedulerStore();
const { items } = storeToRefs(scheduler);

const STATUS = {
  pending: { label: "Scheduled", tone: "neutral" },
  disabled: { label: "Disabled", tone: "muted" },
  completed: { label: "Completed", tone: "success" },
};

function formatRun(iso) {
  if (!iso) return "—";
  return new Date(`${iso}Z`).toLocaleString();
}

onMounted(() => scheduler.load());
</script>

<template>
  <section class="scheduler">
    <header class="scheduler-head">
      <h1 class="h3 mb-1">
        Scheduler
      </h1>
      <p class="text-muted small mb-0">
        Pick "Schedule" instead of "Download now" on the Dashboard to queue a video for later.
      </p>
    </header>

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
          <circle
            cx="12"
            cy="12"
            r="9"
          />
          <path d="M12 7v5l3 2" />
        </svg>
      </span>
      <h2 class="h6 mb-1">
        No schedules yet
      </h2>
      <p class="text-muted small mb-0">
        Fetch a video on the Dashboard, then choose Schedule to queue it for later.
      </p>
    </div>

    <ul
      v-else
      class="sched-list"
    >
      <li
        v-for="s in items"
        :key="s.id"
        class="sched-row"
      >
        <div class="sched-main">
          <p
            class="sched-title"
            :title="s.title || s.url"
          >
            {{ s.title || s.url }}
          </p>
          <p class="sched-meta">
            Runs {{ formatRun(s.next_run) }}
            <template v-if="s.next_run">
              · {{ formatCountdown(s.next_run) }}
            </template>
            <template v-if="s.last_run">
              · last {{ formatRun(s.last_run) }}
            </template>
          </p>
        </div>

        <div class="sched-actions">
          <span
            class="sched-label"
            :class="`sched-label--${STATUS[s.status].tone}`"
          >
            {{ STATUS[s.status].label }}
          </span>

          <button
            v-if="s.status !== 'completed'"
            type="button"
            class="btn-chip"
            @click="scheduler.toggle(s)"
          >
            {{ s.status === "disabled" ? "Enable" : "Disable" }}
          </button>

          <button
            type="button"
            class="btn-chip btn-chip--icon"
            aria-label="Remove schedule"
            title="Remove"
            @click="scheduler.remove(s.id)"
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
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.scheduler {
  max-width: 860px;
  margin: 0 auto;
}

.scheduler-head {
  margin-bottom: 1.25rem;
}

.sched-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid var(--bs-border-color);
  border-radius: var(--bs-border-radius-lg);
  background: var(--bs-body-bg);
  overflow: hidden;
}

.sched-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1.1rem;
}

.sched-row + .sched-row {
  border-top: 1px solid var(--bs-border-color);
}

.sched-main {
  flex: 1;
  min-width: 0;
}

.sched-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sched-meta {
  font-size: 0.8rem;
  color: var(--vh-muted);
  margin: 0.3rem 0 0;
}

.sched-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.sched-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--vh-muted);
}

.sched-label--success {
  color: var(--dl-success, oklch(0.52 0.13 150));
}
</style>
