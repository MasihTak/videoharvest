<script setup>
defineEmits(["toggle-sidebar"]);
</script>

<template>
  <header class="d-flex align-items-center gap-3 border-bottom px-4 py-3">
    <button
      type="button"
      class="btn btn-outline-secondary d-md-none"
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
    <h2 class="h6 mb-0">
      VideoHarvest
    </h2>
  </header>
</template>
