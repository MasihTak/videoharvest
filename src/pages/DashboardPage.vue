<script setup>
import UrlInput from "@/components/UrlInput.vue";
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

    <UrlInput />

    <div class="card border-dashed mt-4">
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
