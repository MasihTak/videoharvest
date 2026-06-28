<script setup>
import { ref } from "vue";

const url = ref("");

defineEmits(["submit"]);
</script>

<template>
  <form @submit.prevent="$emit('submit', url)">
    <div class="input-group input-group-lg shadow-sm">
      <span class="input-group-text bg-body">
        🔗
      </span>
      <input
        v-model="url"
        type="url"
        class="form-control border-start-0"
        placeholder="Paste a video or playlist URL…"
        aria-label="Video or playlist URL"
      />
      <button
        type="submit"
        class="btn btn-primary px-4"
        :disabled="!url"
      >
        Fetch
      </button>
    </div>
    <p class="form-text mt-2 mb-0">
      Works with YouTube and other yt-dlp-supported sites.
    </p>
  </form>
</template>
