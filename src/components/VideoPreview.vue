<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import FormatSelector from "@/components/FormatSelector.vue";
import { useDownloadsStore } from "@/stores/downloads.js";

const props = defineProps({
  data: { type: Object, required: true },
});

const downloads = useDownloadsStore();
const router = useRouter();

const isPlaylist = computed(() => props.data._type === "playlist");

async function onDownload({ selector, format }) {
  await downloads.enqueue({
    url: props.data.webpage_url ?? props.data.original_url,
    title: props.data.title,
    selector,
    format,
  });
  router.push("/downloads");
}

const duration = computed(() => props.data.duration_string);

const platform = computed(() => {
  const extractor = props.data.extractor;
  if (!extractor) return "Unknown";
  const name = extractor.split(":")[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
});

const count = computed(
  () => props.data.playlist_count ?? props.data.entries?.length,
);

const channel = computed(() => props.data.channel ?? props.data.uploader);

const meta = computed(() => {
  const parts = [];
  if (channel.value) parts.push(channel.value);
  if (duration.value) parts.push(duration.value);
  if (isPlaylist.value && count.value) parts.push(`${count.value} videos`);
  return parts.join(" · ");
});
</script>

<template>
  <div>
    <div class="card overflow-hidden">
      <div class="row g-0">
        <div class="col-md-5 thumb-col">
          <img
            v-if="data.thumbnail"
            :src="data.thumbnail"
            :alt="data.title"
            class="thumb-img"
          />
          <div
            v-else
            class="thumb-fallback d-flex align-items-center justify-content-center bg-secondary-subtle text-secondary"
          >
            <svg
              viewBox="0 0 24 24"
              width="32"
              height="32"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <rect
                x="2"
                y="4"
                width="20"
                height="16"
                rx="2"
              />
              <path d="m10 9 5 3-5 3V9z" />
            </svg>
          </div>
        </div>
        <div class="col-md-7">
          <div class="card-body">
            <div class="d-flex gap-1 align-items-center mb-2 flex-wrap">
              <span
                class="badge"
                :class="isPlaylist ? 'text-bg-info' : 'text-bg-primary'"
              >
                {{ isPlaylist ? "Playlist" : "Video" }}
              </span>
              <span class="badge text-bg-secondary">
                {{ platform }}
              </span>
            </div>

            <h2 class="h5 fw-semibold mb-1 mt-2">
              {{ data.title }}
            </h2>

            <p
              v-if="meta"
              class="text-muted small mb-0"
            >
              {{ meta }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <Transition name="fade-up">
      <FormatSelector
        v-if="!isPlaylist && data.formats?.length"
        :formats="data.formats"
        class="mt-3"
        @download="onDownload"
      />
    </Transition>
  </div>
</template>

<style scoped>
.thumb-col {
  position: relative;
  min-height: 160px;
}

.thumb-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.thumb-fallback {
  position: absolute;
  inset: 0;
}

@media (max-width: 767.98px) {
  .thumb-col {
    aspect-ratio: 16 / 9;
    min-height: unset;
  }
}

.fade-up-enter-active {
  transition:
    opacity 220ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 220ms cubic-bezier(0.23, 1, 0.32, 1);
}

.fade-up-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

@media (prefers-reduced-motion: reduce) {
  .fade-up-enter-active { transition: opacity 150ms ease; }
  .fade-up-enter-from { transform: none; }
}
</style>
