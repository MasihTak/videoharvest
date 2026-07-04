<script setup>
import { computed, ref } from "vue";
import { categorizeFormats } from "@/utils/formats.js";

const props = defineProps({
  formats: { type: Array, required: true },
});

const categorized = computed(() => categorizeFormats(props.formats));

const modes = [
  { key: "full", label: "Full video" },
  { key: "video", label: "Video only" },
  { key: "audio", label: "Audio only" },
];

const emit = defineEmits(["download", "schedule"]);

const mode = ref("full");
const selected = ref(null);
const scheduling = ref(false);
const date = ref("");
const time = ref("");

const rows = computed(() => categorized.value[mode.value]);

const selectedRow = computed(() => rows.value.find((r) => r.id === selected.value));

function setMode(key) {
  mode.value = key;
  selected.value = null;
}

function requestDownload() {
  if (selectedRow.value) {
    emit("download", { selector: selectedRow.value.selector, format: selectedRow.value.label });
  }
}

function requestSchedule() {
  if (!selectedRow.value || !date.value || !time.value) return;
  emit("schedule", {
    selector: selectedRow.value.selector,
    format: selectedRow.value.label,
    date: date.value,
    time: time.value,
  });
  scheduling.value = false;
  date.value = "";
  time.value = "";
}
</script>

<template>
  <div class="format-selector">
    <!-- Segmented mode control -->
    <div
      class="mode-tabs"
      role="group"
      aria-label="Format type"
    >
      <button
        v-for="m in modes"
        :key="m.key"
        type="button"
        class="mode-tab"
        :class="{ 'is-active': mode === m.key }"
        :aria-pressed="mode === m.key"
        @click="setMode(m.key)"
      >
        {{ m.label }}
      </button>
    </div>

    <!-- Format list -->
    <div
      v-if="rows.length"
      class="format-list"
      role="listbox"
      aria-label="Available formats"
    >
      <button
        v-for="row in rows"
        :key="row.id"
        type="button"
        class="format-row"
        :class="{ 'is-selected': selected === row.id }"
        role="option"
        :aria-selected="selected === row.id"
        @click="selected = row.id"
      >
        <span class="format-label">{{ row.label }}</span>
        <span class="format-size">{{ row.size }}</span>
      </button>
    </div>

    <p
      v-else
      class="text-muted small mb-0 py-2"
    >
      No formats available for this mode.
    </p>

    <div class="d-flex gap-2 mt-3">
      <button
        type="button"
        class="btn btn-primary flex-grow-1"
        :disabled="!selectedRow"
        @click="requestDownload"
      >
        Download now
      </button>
      <button
        type="button"
        class="btn btn-outline-secondary"
        :disabled="!selectedRow"
        :aria-pressed="scheduling"
        @click="scheduling = !scheduling"
      >
        Schedule
      </button>
    </div>

    <Transition name="fade-up">
      <form
        v-if="scheduling"
        class="schedule-panel mt-2 row g-2 align-items-end"
        @submit.prevent="requestSchedule"
      >
        <div class="col-6 col-md-5">
          <label
            class="form-label small"
            for="fmtDate"
          >Date</label>
          <input
            id="fmtDate"
            v-model="date"
            type="date"
            class="form-control form-control-sm"
            required
          />
        </div>

        <div class="col-6 col-md-4">
          <label
            class="form-label small"
            for="fmtTime"
          >Time</label>
          <input
            id="fmtTime"
            v-model="time"
            type="time"
            class="form-control form-control-sm"
            required
          />
        </div>

        <div class="col-12 col-md-3">
          <button
            type="submit"
            class="btn btn-sm btn-primary w-100"
          >
            Confirm
          </button>
        </div>
      </form>
    </Transition>
  </div>
</template>

<style scoped>
/* Segmented control */
.mode-tabs {
  display: flex;
  background: var(--bs-secondary-bg);
  border-radius: var(--bs-border-radius);
  padding: 3px;
  gap: 2px;
  margin-bottom: 0.75rem;
}

.mode-tab {
  flex: 1;
  padding: 0.35rem 0.75rem;
  border: none;
  border-radius: calc(var(--bs-border-radius) - 2px);
  background: transparent;
  color: var(--bs-secondary-color);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.15s cubic-bezier(0.25, 1, 0.5, 1),
    color 0.15s cubic-bezier(0.25, 1, 0.5, 1),
    box-shadow 0.15s cubic-bezier(0.25, 1, 0.5, 1),
    transform 120ms cubic-bezier(0.23, 1, 0.32, 1);
}

.mode-tab:hover:not(.is-active) {
  color: var(--bs-body-color);
}

.mode-tab:active {
  transform: scale(0.97);
}

.mode-tab.is-active {
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.04);
}

/* Format list */
.format-list {
  border: 1px solid var(--bs-border-color);
  border-radius: var(--bs-border-radius);
  overflow: hidden;
  max-height: 272px;
  overflow-y: auto;
}

.format-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  padding: 0.6rem 0.875rem;
  border: none;
  border-bottom: 1px solid var(--bs-border-color);
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.1s cubic-bezier(0.25, 1, 0.5, 1);
}

.format-row:last-child {
  border-bottom: none;
}

.format-row:hover:not(.is-selected) {
  background: var(--bs-secondary-bg);
}

.format-row:active {
  transform: scale(0.99);
}

.format-row.is-selected {
  background: color-mix(in oklch, var(--vh-primary) 8%, transparent);
}

.format-label {
  font-size: 0.875rem;
  color: var(--bs-body-color);
}

.format-row.is-selected .format-label {
  color: var(--vh-primary);
  font-weight: 500;
}

.format-size {
  font-size: 0.75rem;
  color: var(--bs-secondary-color);
  white-space: nowrap;
  flex-shrink: 0;
}

.format-row.is-selected .format-size {
  color: var(--vh-primary);
  opacity: 0.75;
}

@media (prefers-reduced-motion: reduce) {
  .mode-tab,
  .format-row {
    transition: none;
  }
}

/* Inline schedule panel */
.schedule-panel {
  padding: 0.75rem;
  background: var(--bs-secondary-bg);
  border-radius: var(--bs-border-radius);
}

.fade-up-enter-active {
  transition:
    opacity 180ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 180ms cubic-bezier(0.23, 1, 0.32, 1);
}

.fade-up-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

@media (prefers-reduced-motion: reduce) {
  .fade-up-enter-active {
    transition: opacity 150ms ease;
  }
  .fade-up-enter-from {
    transform: none;
  }
}
</style>
