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
</script>

<template>
  <div>
    <div class="card overflow-hidden">
      <div class="row g-0">
        <div class="col-md-5">
          <img
            v-if="data.thumbnail"
            :src="data.thumbnail"
            :alt="data.title"
            class="img-fluid w-100 h-100 object-fit-cover"
          />
          <div
            v-else
            class="w-100 h-100 d-flex align-items-center justify-content-center bg-secondary-subtle text-secondary"
            style="min-height: 140px;"
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
            <div class="mb-2">
              <span
                class="badge me-1 p-2 rounded-2"
                :class="isPlaylist ? 'text-bg-info' : 'text-bg-primary'"
              >
                {{ isPlaylist ? "Playlist" : "Video" }}
              </span>
              <span class="badge text-bg-secondary p-2 rounded-2">
                {{ platform }}
              </span>
              <span
                v-if="isPlaylist && count"
                class="text-muted small ms-2"
              >
                {{ count }} videos
              </span>
            </div>
            <h2 class="h5 card-title mt-3">
              {{ data.title }}
            </h2>
            <p
              v-if="channel"
              class="card-text text-muted small mb-1"
            >
              {{ channel }}
            </p>
            <p
              v-if="duration"
              class="card-text text-muted mb-0"
            >
              {{ duration }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <FormatSelector
      v-if="!isPlaylist && data.formats?.length"
      :formats="data.formats"
      class="mt-4"
      @download="onDownload"
    />
  </div>
</template>
