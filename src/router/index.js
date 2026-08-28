import { createRouter, createWebHistory } from "vue-router";

const routes = [
  { path: "/", redirect: "/dashboard" },
  {
    path: "/dashboard",
    component: () => import("@/pages/DashboardPage.vue"),
    meta: { title: "Dashboard", subtitle: "Paste a link to preview and download" },
  },
  {
    path: "/downloads",
    component: () => import("@/pages/DownloadsPage.vue"),
    meta: { title: "Downloads", subtitle: "Track active and past downloads" },
  },
  {
    path: "/scheduler",
    component: () => import("@/pages/SchedulerPage.vue"),
    meta: { title: "Scheduler", subtitle: "Upcoming and recurring downloads" },
  },
  {
    path: "/logs",
    component: () => import("@/pages/LogsPage.vue"),
    meta: { title: "Logs", subtitle: "Activity history and diagnostics" },
  },
  {
    path: "/settings",
    component: () => import("@/pages/SettingsPage.vue"),
    meta: { title: "Settings", subtitle: "Defaults, scheduler, and updates" },
  },
  {
    path: "/about",
    component: () => import("@/pages/AboutPage.vue"),
    meta: { title: "About", subtitle: "Version, links, and sponsors" },
  },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
