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

const emit = defineEmits(["download"]);

const mode = ref("full");
const selected = ref(null);

const rows = computed(() => categorized.value[mode.value]);

const selectedRow = computed(() => rows.value.find((r) => r.id === selected.value));

function requestDownload() {
  if (selectedRow.value) {
    emit("download", { selector: selectedRow.value.selector, format: selectedRow.value.label });
  }
}
</script>

<template>
  <div class="format-selector">
    <ul class="nav nav-pills gap-2 mb-3">
      <li
        v-for="m in modes"
        :key="m.key"
        class="nav-item"
      >
        <button
          type="button"
          class="nav-link"
          :class="{ active: mode === m.key }"
          @click="mode = m.key"
        >
          {{ m.label }}
        </button>
      </li>
    </ul>

    <div
      v-if="rows.length"
      class="list-group"
    >
      <button
        v-for="row in rows"
        :key="row.id"
        type="button"
        class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
        :class="{ active: selected === row.id }"
        @click="selected = row.id"
      >
        <span>{{ row.label }}</span>
        <span
          class="badge rounded-pill"
          :class="selected === row.id ? 'text-bg-light' : 'text-bg-secondary'"
        >
          {{ row.size }}
        </span>
      </button>
    </div>
    <p
      v-else
      class="text-muted small mb-0"
    >
      No formats available for this mode.
    </p>

    <button
      type="button"
      class="btn btn-primary mt-3"
      :disabled="!selectedRow"
      @click="requestDownload"
    >
      Download
    </button>
  </div>
</template>
