<script setup>
import { computed } from "vue";

const props = defineProps({
  data: { type: Object, required: true },
});

const isPlaylist = computed(() => props.data._type === "playlist");

const duration = computed(() => props.data.duration_string);
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
          <span
            class="badge mb-2"
            :class="isPlaylist ? 'text-bg-info' : 'text-bg-primary'"
          >
            {{ isPlaylist ? "Playlist" : "Video" }}
          </span>
          <h2 class="h5 card-title">
            {{ data.title }}
          </h2>
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
