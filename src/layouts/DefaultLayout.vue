<script setup>
import { ref } from "vue";
import AppSidebar from "@/components/AppSidebar.vue";
import AppHeader from "@/components/AppHeader.vue";
import AppFooter from "@/components/AppFooter.vue";

const sidebarOpen = ref(false);
</script>

<template>
  <div class="d-flex vh-100 overflow-hidden">
    <Transition name="backdrop">
      <div
        v-if="sidebarOpen"
        class="sidebar-backdrop d-md-none"
        aria-hidden="true"
        @click="sidebarOpen = false"
      />
    </Transition>
    <AppSidebar
      :open="sidebarOpen"
      @close="sidebarOpen = false"
    />
    <div class="d-flex flex-column flex-grow-1 min-vw-0">
      <AppHeader @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="flex-grow-1 overflow-auto p-4">
        <slot />
      </main>
      <AppFooter />
    </div>
  </div>
</template>

<style scoped>
.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1039;
}

.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.2s cubic-bezier(0.25, 1, 0.5, 1);
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .backdrop-enter-active,
  .backdrop-leave-active {
    transition: none;
  }
}
</style>
