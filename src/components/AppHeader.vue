<script setup>
import { useRoute } from "vue-router";

defineEmits(["toggle-sidebar"]);

const route = useRoute();
</script>

<template>
  <header class="app-header d-flex align-items-center gap-3 border-bottom">
    <button
      type="button"
      class="header-toggle d-md-none"
      aria-label="Toggle navigation"
      @click="$emit('toggle-sidebar')"
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <path d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
    <div class="header-titles min-w-0">
      <h1 class="app-title mb-0">
        {{ route.meta.title }}
      </h1>
      <p
        v-if="route.meta.subtitle"
        class="app-subtitle mb-0"
      >
        {{ route.meta.subtitle }}
      </p>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  min-height: 66px;
  padding: 0.875rem 2rem;
  background-color: var(--bs-body-bg);
}

.header-titles {
  overflow: hidden;
}

.app-title {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.2;
  color: var(--vh-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-subtitle {
  font-size: 0.8125rem;
  color: var(--vh-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  flex-shrink: 0;
  color: var(--vh-ink);
  border: 1px solid var(--bs-border-color);
  border-radius: var(--bs-border-radius);
  background: none;
}

.header-toggle:hover {
  background-color: var(--bs-tertiary-bg);
}
</style>
