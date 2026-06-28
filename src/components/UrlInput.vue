<script setup>
import { ref } from "vue";

const url = ref("");

defineEmits(["submit"]);
</script>

<template>
  <form @submit.prevent="$emit('submit', url.trim())">
    <div class="input-group input-group-lg shadow-sm">
      <span class="input-group-text bg-body">
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </span>
      <input
        v-model="url"
        type="url"
        class="form-control border-start-0"
        placeholder="Paste a video or playlist URL…"
        aria-label="Video or playlist URL"
        required
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
