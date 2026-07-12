<script setup>
defineEmits(["toggle-sidebar"]);
</script>

<template>
  <header class="app-header d-flex align-items-center gap-3 border-bottom px-4 py-3">
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
    <h2 class="app-title mb-0">
      VideoHarvest
    </h2>
  </header>
</template>

<style scoped>
.app-header {
  min-height: 64px;
  background-color: var(--bs-body-bg);
}

.app-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.app-title {
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--vh-ink);
}

.header-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  color: var(--vh-ink);
  border: 1px solid var(--bs-border-color);
  border-radius: var(--bs-border-radius);
  background: none;
}

.header-toggle:hover {
  background-color: var(--bs-tertiary-bg);
}
</style>
