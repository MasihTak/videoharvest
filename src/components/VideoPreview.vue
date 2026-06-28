<script setup>
import { computed } from "vue";

const props = defineProps({
  data: { type: Object, required: true },
});

const isPlaylist = computed(() => props.data._type === "playlist");

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
  <div class="card overflow-hidden">
    <div class="row g-0">
      <div class="col-md-5">
        <img
          v-if="data.thumbnail"
          :src="data.thumbnail"
          :alt="data.title"
          class="img-fluid w-100 h-100 object-fit-cover"
        />
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
</template>
