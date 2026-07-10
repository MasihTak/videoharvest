import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";

const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/assets/scss/utilities/tokens";`,
        silenceDeprecations: [
          "color-functions",
          "global-builtin",
          "import",
          "if-function",
        ], // bootstrap 5 warnings
      },
    },
  },

  envPrefix: ["VITE_", "TAURI_ENV_*"],

  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.js"],
      // App bootstrap and the route table are declarative wiring with no logic
      // of their own, and require a DOM (createWebHistory/mount) to execute at all.
      exclude: ["src/main.js", "src/router/**"],
    },
  },

  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}));
