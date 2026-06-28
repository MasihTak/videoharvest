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
      ☰
    </button>
    <h2 class="h6 mb-0">
      VideoHarvest
    </h2>
  </header>
</template>
