<script setup>
import { ref } from "vue";
import AppSidebar from "@/components/AppSidebar.vue";
import AppHeader from "@/components/AppHeader.vue";
import AppFooter from "@/components/AppFooter.vue";

const sidebarOpen = ref(false);
</script>

<template>
  <div class="d-flex min-vh-100">
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
