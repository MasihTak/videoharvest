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

    <!-- Skeleton loading state — mirrors VideoPreview layout -->
    <div
      v-if="loading"
      class="card overflow-hidden mt-4"
      aria-busy="true"
      aria-label="Fetching video details"
    >
      <div class="row g-0">
        <div class="col-md-5">
          <div class="ratio ratio-16x9">
            <div class="skeleton" />
          </div>
        </div>
        <div class="col-md-7">
          <div class="card-body d-flex flex-column gap-3 py-4">
            <div class="skeleton skeleton-line w-25" />
            <div>
              <div class="skeleton skeleton-line w-100 mb-2" />
              <div class="skeleton skeleton-line w-75" />
            </div>
            <div class="skeleton skeleton-line w-40" />
          </div>
        </div>
      </div>
    </div>

    <Transition name="fade-up">
      <div
        v-if="error"
        class="alert alert-danger mt-4"
        role="alert"
      >
        {{ error }}
      </div>
    </Transition>

    <Transition name="fade-up">
      <VideoPreview
        v-if="preview"
        :data="preview"
        class="mt-4"
      />
    </Transition>

    <div
      v-if="!loading && !error && !preview"
      class="dashboard-empty text-center text-muted mt-5 py-3"
    >
      <svg
        viewBox="0 0 24 24"
        width="40"
        height="40"
        fill="none"
        stroke="currentColor"
        stroke-width="1.25"
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
      <p class="mt-3 mb-0">
        Paste a URL above to preview and download.
      </p>
    </div>
  </section>
</template>

<style scoped>
.dashboard {
  max-width: 720px;
}

.w-40 {
  width: 40%;
}

/* Shimmer skeleton */
@keyframes shimmer {
  to { background-position: -200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--bs-secondary-bg) 25%,
    var(--bs-tertiary-bg) 50%,
    var(--bs-secondary-bg) 75%
  );
  background-size: 200%;
  animation: shimmer 1.4s ease-in-out infinite;
}

.skeleton-line {
  height: 13px;
  border-radius: var(--bs-border-radius-sm);
}

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
    background: var(--bs-secondary-bg);
  }
}

/* Content fade-up entrance */
.fade-up-enter-active {
  transition:
    opacity 220ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 220ms cubic-bezier(0.23, 1, 0.32, 1);
}

.fade-up-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

@media (prefers-reduced-motion: reduce) {
  .fade-up-enter-active {
    transition: opacity 150ms ease;
  }
  .fade-up-enter-from {
    transform: none;
  }
}
</style>
