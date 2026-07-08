<script setup>
import { ref } from "vue";
import { RouterLink } from "vue-router";

defineProps({
  open: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["close"]);

const collapsed = ref(localStorage.getItem("sidebar-collapsed") === "true");

function toggleCollapsed() {
  collapsed.value = !collapsed.value;
  localStorage.setItem("sidebar-collapsed", String(collapsed.value));
}

const NAV_ITEMS = [
  {
    to: "/dashboard",
    label: "Dashboard",
    paths: ["M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"],
  },
  {
    to: "/downloads",
    label: "Downloads",
    paths: ["M12 3v12m0 0 4-4m-4 4-4-4", "M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2"],
  },
  {
    to: "/scheduler",
    label: "Scheduler",
    rect: { x: 3, y: 4, width: 18, height: 17, rx: 2 },
    paths: ["M3 9h18M8 2v4m8-4v4"],
  },
  {
    to: "/logs",
    label: "Logs",
    paths: ["M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"],
  },
];

const FOOTER_NAV_ITEMS = [
  {
    to: "/settings",
    label: "Settings",
    circle: { cx: 12, cy: 12, r: 3 },
    paths: [
      "M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z",
    ],
  },
];
</script>

<template>
  <aside
    class="app-sidebar flex-shrink-0 d-flex flex-column"
    :class="{ 'is-open': open, 'is-collapsed': collapsed }"
  >
    <button
      type="button"
      class="sidebar-logo"
      :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      @click="toggleCollapsed"
    >
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="currentColor"
      >
        <circle
          cx="8"
          cy="8"
          r="3"
        />
        <circle
          cx="16"
          cy="8"
          r="3"
        />
        <circle
          cx="8"
          cy="16"
          r="3"
        />
        <circle
          cx="16"
          cy="16"
          r="3"
        />
      </svg>
    </button>

    <nav class="sidebar-nav d-flex flex-column gap-2">
      <RouterLink
        v-for="item in NAV_ITEMS"
        :key="item.to"
        :to="item.to"
        class="sidebar-item"
        active-class="is-active"
        @click="$emit('close')"
      >
        <span class="sidebar-icon">
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect
              v-if="item.rect"
              v-bind="item.rect"
            />
            <path
              v-for="d in item.paths"
              :key="d"
              :d="d"
            />
          </svg>
        </span>
        <span class="sidebar-label">{{ item.label }}</span>
      </RouterLink>
    </nav>

    <nav class="sidebar-footer d-flex flex-column gap-2 mt-auto">
      <RouterLink
        v-for="item in FOOTER_NAV_ITEMS"
        :key="item.to"
        :to="item.to"
        class="sidebar-item"
        active-class="is-active"
        @click="$emit('close')"
      >
        <span class="sidebar-icon">
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle
              v-if="item.circle"
              v-bind="item.circle"
            />
            <path
              v-for="d in item.paths"
              :key="d"
              :d="d"
            />
          </svg>
        </span>
        <span class="sidebar-label">{{ item.label }}</span>
      </RouterLink>
    </nav>
  </aside>
</template>

<style scoped>
.app-sidebar {
  width: 248px;
  padding: 1rem;
  gap: 1.5rem;
  overflow: hidden;
  background-color: var(--bs-dark);
  color: #fff;
  will-change: width;
  transition: width 0.2s cubic-bezier(0.25, 1, 0.5, 1);
}

.app-sidebar.is-collapsed {
  width: 76px;
}

.sidebar-label {
  font-size: 0.95rem;
  font-weight: 500;
  opacity: 1;
  transition: opacity 0.1s cubic-bezier(0.25, 1, 0.5, 1);
  white-space: nowrap;
  overflow: hidden;
}

.app-sidebar.is-collapsed .sidebar-label {
  opacity: 0;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .app-sidebar,
  .sidebar-label {
    transition: none;
  }
}

.sidebar-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  padding: 0;
  color: #fff;
  border-radius: 14px;
  background-color: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: background-color 0.15s cubic-bezier(0.25, 1, 0.5, 1);
}

.sidebar-logo:hover {
  background-color: rgba(255, 255, 255, 0.12);
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.4rem;
  border-radius: 14px;
  color: rgba(255, 255, 255, 0.65);
  text-decoration: none;
  transition: color 0.15s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.15s cubic-bezier(0.25, 1, 0.5, 1);
}

.sidebar-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: background-color 0.15s cubic-bezier(0.25, 1, 0.5, 1), border-color 0.15s cubic-bezier(0.25, 1, 0.5, 1);
}

.sidebar-label {
  font-size: 0.95rem;
  font-weight: 500;
}

.sidebar-item:hover {
  color: #fff;
}

.sidebar-item:hover .sidebar-icon {
  background-color: rgba(255, 255, 255, 0.08);
}

.sidebar-item.is-active {
  color: #fff;
}

.sidebar-item.is-active .sidebar-icon {
  background-color: var(--bs-primary);
  border-color: transparent;
  color: #fff;
}

@media (max-width: 767.98px) {
  .app-sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 1040;
    transform: translateX(-100%);
    transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1);
  }

  .app-sidebar.is-open {
    transform: translateX(0);
  }
}
</style>
