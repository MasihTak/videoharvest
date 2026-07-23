import { createRouter, createWebHistory } from "vue-router";

const routes = [
  { path: "/", redirect: "/dashboard" },
  { path: "/dashboard", component: () => import("@/pages/DashboardPage.vue") },
  { path: "/downloads", component: () => import("@/pages/DownloadsPage.vue") },
  { path: "/scheduler", component: () => import("@/pages/SchedulerPage.vue") },
  { path: "/logs", component: () => import("@/pages/LogsPage.vue") },
  { path: "/settings", component: () => import("@/pages/SettingsPage.vue") },
  { path: "/about", component: () => import("@/pages/AboutPage.vue") },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
