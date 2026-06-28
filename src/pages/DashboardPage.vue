<script setup>
import { ref } from "vue";
import UrlInput from "@/components/UrlInput.vue";
import VideoPreview from "@/components/VideoPreview.vue";
import { fetchMetadata } from "@/services/metadata.js";

const loading = ref(false);
const error = ref("");
const preview = ref(null);

async function handleSubmit(url) {
  if (!url) return;
  loading.value = true;
  error.value = "";
  preview.value = null;
  try {
    preview.value = await fetchMetadata(url);
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section class="dashboard mx-auto">
    <header class="mb-4">
      <h1 class="h3 mb-1">
        Download a video
      </h1>
      <p class="text-muted mb-0">
        Paste a link to fetch its details and pick a format.
      </p>
    </header>

    <UrlInput @submit="handleSubmit" />

    <div
      v-if="loading"
      class="card border-dashed mt-4"
    >
      <div class="card-body text-center text-muted py-5">
        <div
          class="spinner-border mb-3"
          role="status"
        />
        <p class="mb-0">
          Fetching video details…
        </p>
      </div>
    </div>

    <div
      v-else-if="error"
      class="alert alert-danger mt-4"
      role="alert"
    >
      {{ error }}
    </div>

    <VideoPreview
      v-else-if="preview"
      :data="preview"
      class="mt-4"
    />

    <div
      v-else
      class="card border-dashed mt-4"
    >
      <div class="card-body text-center text-muted py-5">
        <div class="preview-placeholder mx-auto mb-3 rounded" />
        <p class="mb-0">
          Paste a URL above to preview the video here.
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dashboard {
  max-width: 720px;
}

.border-dashed {
  border-style: dashed;
}

.preview-placeholder {
  width: 160px;
  height: 90px;
  background: var(--bs-secondary-bg, #e9ecef);
}
</style>
