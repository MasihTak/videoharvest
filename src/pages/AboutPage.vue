<script setup>
import { ref, onMounted } from "vue";
import { openUrl } from "@tauri-apps/plugin-opener";
import logo from "@/assets/logo.png";

const APP_VERSION = "0.2.0";
const REPO_URL = "https://github.com/MasihTak/videoharvest";
const RELEASES_URL = `${REPO_URL}/releases`;

// "checking" | "up-to-date" | "update-available" | "error"
const updateStatus = ref("checking");

onMounted(async () => {
  try {
    const response = await fetch("https://api.github.com/repos/MasihTak/videoharvest/releases/latest");
    if (!response.ok) throw new Error("Failed to fetch latest release");
    const { tag_name: latestTag } = await response.json();
    const latestVersion = latestTag.replace(/^v/, "");
    updateStatus.value = latestVersion === APP_VERSION ? "up-to-date" : "update-available";
  } catch {
    updateStatus.value = "error";
  }
});

const SPONSORS = [
  {
    name: "JetBrains",
    logo: "/jetbrains.svg",
    url: "https://www.jetbrains.com/?from=MasihTak",
  },
  {
    name: "BitDefender",
    logo: "/bitdefender-seeklogo.svg",
    url: "https://www.bitdefender.com/?from=MasihTak",
  },
  {
    name: "Mery",
    logo: "/Mery.svg",
    url: "https://www.fashionmery.com/?from=MasihTak",
  },
];

const AUTHOR_URL = "https://github.com/MasihTak";
</script>

<template>
  <section class="about">
    <header class="about-head">
      <h1 class="h3 mb-1">
        About
      </h1>
      <p class="text-muted small mb-0">
        Version, credits, and the tools this app is built on.
      </p>
    </header>

    <div class="about-panel">
      <div class="about-app">
        <img
          :src="logo"
          alt="VideoHarvest"
          class="about-app-logo"
        />
        <div class="about-app-info">
          <h2 class="about-app-name">
            VideoHarvest
          </h2>
          <p class="about-app-desc">
            Download videos and playlists with yt-dlp, no command line required.
          </p>
        </div>
      </div>

      <div class="about-meta">
        <span class="badge text-bg-secondary">v{{ APP_VERSION }}</span>
        <span
          v-if="updateStatus === 'up-to-date'"
          class="update-status"
        >
          <span class="update-dot is-current" />
          Up to date
        </span>
        <span
          v-else-if="updateStatus === 'update-available'"
          class="update-status"
        >
          <span class="update-dot is-outdated" />
          Update available
        </span>
        <button
          type="button"
          class="btn-chip"
          @click="openUrl(REPO_URL)"
        >
          View on GitHub
        </button>
        <button
          type="button"
          class="btn-chip"
          @click="openUrl(RELEASES_URL)"
        >
          Release notes
        </button>
        <button
          type="button"
          class="btn-chip"
          @click="openUrl(AUTHOR_URL)"
        >
          By MasihTak
        </button>
      </div>

      <div class="about-divider" />

      <div class="about-sponsors">
        <h2 class="about-sponsors-title">
          Sponsors
        </h2>
        <div class="sponsor-row">
          <button
            v-for="sponsor in SPONSORS"
            :key="sponsor.name"
            type="button"
            class="sponsor-item"
            @click="openUrl(sponsor.url)"
          >
            <img
              :src="sponsor.logo"
              :alt="sponsor.name"
              class="sponsor-logo"
            />
            <span class="sponsor-name">{{ sponsor.name }}</span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.about {
  max-width: 560px;
  margin: 0 auto;
}

.about-head {
  margin-bottom: 1.25rem;
}

.about-panel {
  padding: 1.5rem;
  border: 1px solid var(--bs-border-color);
  border-radius: var(--bs-border-radius-lg);
  background: var(--bs-body-bg);
}

.about-app {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.about-app-logo {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  object-fit: contain;
}

.about-app-name {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.15rem;
}

.about-app-desc {
  font-size: 0.85rem;
  color: var(--vh-muted);
  margin: 0;
}

.about-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.875rem;
}

.update-status {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: var(--vh-muted);
}

.update-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.update-dot.is-current {
  background-color: var(--bs-success);
}

.update-dot.is-outdated {
  background-color: var(--bs-warning);
}

.about-divider {
  height: 1px;
  margin: 1.25rem 0;
  background: var(--bs-border-color);
}

.about-sponsors-title {
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--vh-ink);
  margin: 0 0 0.75rem;
}

.sponsor-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.sponsor-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  border: none;
  border-radius: var(--bs-border-radius);
  background: transparent;
  cursor: pointer;
  transition: background-color 0.15s cubic-bezier(0.25, 1, 0.5, 1);
}

.sponsor-item:hover {
  background: var(--bs-secondary-bg);
}

.sponsor-logo {
  height: 24px;
  width: 24px;
  object-fit: contain;
}

.sponsor-name {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--vh-ink);
}
</style>
