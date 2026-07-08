<script setup>
import { computed, ref } from "vue";
import { useDownloadsStore } from "@/stores/downloads.js";
import { useRouter } from "vue-router";
import { pickThumbnail } from "@/utils/formats.js";
import ModeTabs from "@/components/ModeTabs.vue";

const props = defineProps({
  data: { type: Object, required: true },
});

const downloads = useDownloadsStore();
const router = useRouter();

const entries = computed(() =>
  (props.data.entries ?? []).map((e, i) => ({
    index: i,
    title: e.title || e.url || `Video ${i + 1}`,
    url: e.url ?? e.webpage_url,
    duration: e.duration_string,
    thumbnail: pickThumbnail(e),
  })),
);

const checked = ref(new Set(entries.value.map((e) => e.index)));
const rangeFrom = ref(1);
const rangeTo = ref(entries.value.length);

// yt-dlp's --flat-playlist listing has no per-video formats[] (a full
// extraction per video would be needed for that), so quality is a height
// cap passed straight to the format selector rather than picked from a
// real formats list.
const mode = ref("full");

const QUALITIES = [
  { id: "best", label: "Best available", height: null },
  { id: "2160", label: "2160p (4K)", height: 2160 },
  { id: "1440", label: "1440p", height: 1440 },
  { id: "1080", label: "1080p", height: 1080 },
  { id: "720", label: "720p", height: 720 },
  { id: "480", label: "480p", height: 480 },
  { id: "360", label: "360p", height: 360 },
];
const quality = ref("best");

const selector = computed(() => {
  if (mode.value === "audio") return "ba/b";
  const height = QUALITIES.find((q) => q.id === quality.value)?.height;
  const cap = height ? `[height<=${height}]` : "";
  if (mode.value === "video") return `bv*${cap}`;
  return `bv*${cap}+ba/b${cap ? "/b" + cap : ""}`;
});

const formatLabel = computed(() => {
  if (mode.value === "audio") return "Audio only";
  const q = QUALITIES.find((v) => v.id === quality.value).label;
  return `${mode.value === "video" ? "Video only" : "Full video"} · ${q}`;
});

const selectedCount = computed(() => checked.value.size);

function toggle(index) {
  const next = new Set(checked.value);
  if (next.has(index)) next.delete(index);
  else next.add(index);
  checked.value = next;
}

function selectAll() {
  checked.value = new Set(entries.value.map((e) => e.index));
}

function selectNone() {
  checked.value = new Set();
}

function applyRange() {
  const from = Math.max(1, rangeFrom.value) - 1;
  const to = Math.min(entries.value.length, rangeTo.value) - 1;
  const next = new Set();
  for (let i = from; i <= to; i++) next.add(i);
  checked.value = next;
}

async function download() {
  const selected = entries.value.filter((e) => checked.value.has(e.index) && e.url);
  if (!selected.length) return;
  await downloads.enqueuePlaylist({
    entries: selected,
    selector: selector.value,
    format: formatLabel.value,
    playlistTitle: props.data.title,
  });
  router.push("/downloads");
}
</script>

<template>
  <div class="playlist-picker">
    <ModeTabs v-model="mode" />

    <div
      v-if="mode !== 'audio'"
      class="quality-list"
      role="listbox"
      aria-label="Quality"
    >
      <button
        v-for="q in QUALITIES"
        :key="q.id"
        type="button"
        class="quality-row"
        :class="{ 'is-selected': quality === q.id }"
        role="option"
        :aria-selected="quality === q.id"
        @click="quality = q.id"
      >
        {{ q.label }}
      </button>
    </div>

    <div class="range-row">
      <label class="range-label">From</label>
      <input
        v-model.number="rangeFrom"
        type="number"
        class="form-control form-control-sm range-input"
        min="1"
        :max="entries.length"
      />
      <label class="range-label">to</label>
      <input
        v-model.number="rangeTo"
        type="number"
        class="form-control form-control-sm range-input"
        min="1"
        :max="entries.length"
      />
      <button
        type="button"
        class="btn-chip"
        @click="applyRange"
      >
        Apply range
      </button>
      <span class="range-spacer" />
      <button
        type="button"
        class="btn-chip"
        @click="selectAll"
      >
        Select all
      </button>
      <button
        type="button"
        class="btn-chip"
        @click="selectNone"
      >
        Select none
      </button>
    </div>

    <ul class="entry-list">
      <li
        v-for="e in entries"
        :key="e.index"
        class="entry-row"
      >
        <label class="entry-label">
          <input
            type="checkbox"
            class="form-check-input"
            :checked="checked.has(e.index)"
            @change="toggle(e.index)"
          />
          <span class="entry-index">{{ e.index + 1 }}</span>
          <img
            v-if="e.thumbnail"
            :src="e.thumbnail"
            alt=""
            class="entry-thumb"
          />
          <span class="entry-title">{{ e.title }}</span>
          <span
            v-if="e.duration"
            class="entry-duration"
          >{{ e.duration }}</span>
        </label>
      </li>
    </ul>

    <button
      type="button"
      class="btn btn-primary w-100 mt-3"
      :disabled="!selectedCount"
      @click="download"
    >
      Download {{ selectedCount }} video{{ selectedCount === 1 ? "" : "s" }}
    </button>
  </div>
</template>

<style scoped>
.quality-list {
  border: 1px solid var(--bs-border-color);
  border-radius: var(--bs-border-radius);
  overflow: hidden;
  margin-bottom: 0.75rem;
  max-height: 200px;
  overflow-y: auto;
}

.quality-row {
  display: block;
  width: 100%;
  padding: 0.5rem 0.875rem;
  border: none;
  border-bottom: 1px solid var(--bs-border-color);
  background: transparent;
  text-align: left;
  font-size: 0.875rem;
  color: var(--bs-body-color);
  cursor: pointer;
}

.quality-row:last-child {
  border-bottom: none;
}

.quality-row:hover:not(.is-selected) {
  background: var(--bs-secondary-bg);
}

.quality-row.is-selected {
  background: color-mix(in oklch, var(--vh-primary) 8%, transparent);
  color: var(--vh-primary);
  font-weight: 500;
}

.range-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.range-label {
  font-size: 0.8rem;
  color: var(--bs-secondary-color);
  margin: 0;
}

.range-input {
  width: 4.5rem;
}

.range-spacer {
  flex: 1;
}

.entry-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid var(--bs-border-color);
  border-radius: var(--bs-border-radius);
  max-height: 320px;
  overflow-y: auto;
}

.entry-row + .entry-row {
  border-top: 1px solid var(--bs-border-color);
}

.entry-label {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  margin: 0;
  cursor: pointer;
  font-weight: 400;
}

.entry-index {
  font-size: 0.75rem;
  color: var(--bs-secondary-color);
  width: 1.75rem;
  flex-shrink: 0;
  text-align: right;
}

.entry-thumb {
  width: 48px;
  height: 27px;
  flex-shrink: 0;
  object-fit: cover;
  border-radius: 4px;
  background: var(--bs-secondary-bg);
}

.entry-title {
  flex: 1;
  font-size: 0.875rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-duration {
  font-size: 0.75rem;
  color: var(--bs-secondary-color);
  flex-shrink: 0;
}
</style>
