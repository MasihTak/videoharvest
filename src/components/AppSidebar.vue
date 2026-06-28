<script setup>
import { RouterLink } from "vue-router";

defineProps({
  open: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["close"]);

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/downloads", label: "Downloads" },
  { to: "/scheduler", label: "Scheduler" },
  { to: "/logs", label: "Logs" },
  { to: "/settings", label: "Settings" },
];
</script>

<template>
  <aside
    class="app-sidebar bg-dark text-white p-3 flex-shrink-0"
    :class="{ 'is-open': open }"
  >
    <h1 class="h5 mb-4">
      VideoHarvest
    </h1>
    <nav class="nav flex-column gap-1">
      <RouterLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="nav-link text-white rounded px-3 py-2"
        active-class="active bg-primary"
        @click="$emit('close')"
      >
        {{ link.label }}
      </RouterLink>
    </nav>
  </aside>
</template>

<style scoped>
.app-sidebar {
  width: 240px;
}

@media (max-width: 767.98px) {
  .app-sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 1040;
    transform: translateX(-100%);
    transition: transform 0.2s ease;
  }

  .app-sidebar.is-open {
    transform: translateX(0);
  }
}
</style>
