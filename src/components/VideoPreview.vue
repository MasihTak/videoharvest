<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import FormatSelector from "@/components/FormatSelector.vue";
import { useDownloadsStore } from "@/stores/downloads.js";

const props = defineProps({
  data: { type: Object, required: true },
});

const downloads = useDownloadsStore();
const router = useRouter();

const isPlaylist = computed(() => props.data._type === "playlist");
const isLive = computed(() => props.data.is_live || props.data.live_status === "is_live");

const platform = computed(() => {
  const extractor = props.data.extractor;
  if (!extractor) return "Unknown";
  const name = extractor.split(":")[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
});

const channel = computed(() => props.data.channel ?? props.data.uploader);
const duration = computed(() => props.data.duration_string);
const count = computed(() => props.data.playlist_count ?? props.data.entries?.length);

const viewCount = computed(() => {
  const v = props.data.view_count;
  if (!v) return null;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M views`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}K views`;
  return `${v.toLocaleString()} views`;
});

const uploadDate = computed(() => {
  const d = props.data.upload_date;
  if (!d || d.length !== 8) return null;
  const date = new Date(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`);
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
});

const likeCount = computed(() => {
  const v = props.data.like_count;
  if (!v) return null;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}K`;
  return v.toLocaleString();
});

const resolution = computed(() => {
  if (isPlaylist.value) return null;
  const h = props.data.height;
  if (!h) return null;
  if (h >= 2160) return "4K";
  if (h >= 1440) return "1440p";
  if (h >= 1080) return "1080p";
  if (h >= 720) return "720p";
  if (h >= 480) return "480p";
  return `${h}p`;
});

async function onDownload({ selector, format }) {
  await downloads.enqueue({
    url: props.data.webpage_url ?? props.data.original_url,
    title: props.data.title,
    selector,
    format,
  });
  router.push("/downloads");
}
</script>

<template>
  <div>
    <div class="preview-card card overflow-hidden">
      <div class="row g-0">
        <!-- Thumbnail -->
        <div class="col-md-5 thumb-col">
          <img
            v-if="data.thumbnail"
            :src="data.thumbnail"
            :alt="data.title"
            class="thumb-img"
          />
          <div
            v-else
            class="thumb-fallback d-flex align-items-center justify-content-center"
          >
            <svg
              viewBox="0 0 24 24"
              width="40"
              height="40"
              fill="none"
              stroke="currentColor"
              stroke-width="1.25"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <rect
                x="2"
                y="4"
                width="20"
                height="16"
                rx="2"
              />
              <path d="m10 9 5 3-5 3V9z" />
            </svg>
          </div>

          <!-- Bottom gradient for badge legibility -->
          <div
            v-if="data.thumbnail"
            class="thumb-gradient"
            aria-hidden="true"
          />

          <!-- Duration / playlist count -->
          <span
            v-if="isLive"
            class="thumb-pill thumb-pill--live"
          >LIVE</span>
          <span
            v-else-if="duration && !isPlaylist"
            class="thumb-pill"
          >{{ duration }}</span>
          <span
            v-else-if="isPlaylist && count"
            class="thumb-pill"
          >{{ count }} videos</span>

          <!-- Resolution -->
          <span
            v-if="resolution"
            class="thumb-pill thumb-pill--tl"
          >{{ resolution }}</span>
        </div>

        <!-- Info panel -->
        <div class="col-md-7 d-flex flex-column">
          <div class="info-body d-flex flex-column flex-grow-1">
            <!-- Type + platform tags -->
            <div class="tag-row">
              <span
                class="tag"
                :class="isPlaylist ? 'tag--info' : isLive ? 'tag--live' : 'tag--primary'"
              >
                {{ isPlaylist ? "Playlist" : isLive ? "Live" : "Video" }}
              </span>
              <span class="tag tag--neutral">{{ platform }}</span>
            </div>

            <!-- Title -->
            <h2 class="preview-title">
              {{ data.title }}
            </h2>

            <!-- Channel -->
            <p
              v-if="channel"
              class="preview-channel"
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="8"
                  r="4"
                />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
              <span>{{ channel }}</span>
            </p>

            <!-- Stats -->
            <div
              v-if="viewCount || likeCount || uploadDate"
              class="stats-row"
            >
              <span
                v-if="viewCount"
                class="stat-item"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="13"
                  height="13"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle
                    cx="12"
                    cy="12"
                    r="3"
                  />
                </svg>
                {{ viewCount }}
              </span>

              <span
                v-if="likeCount"
                class="stat-item"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="13"
                  height="13"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
                </svg>
                {{ likeCount }}
              </span>

              <span
                v-if="uploadDate"
                class="stat-item"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="13"
                  height="13"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <rect
                    x="3"
                    y="4"
                    width="18"
                    height="18"
                    rx="2"
                  />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                {{ uploadDate }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Transition name="fade-up">
      <FormatSelector
        v-if="!isPlaylist && data.formats?.length"
        :formats="data.formats"
        class="mt-3"
        @download="onDownload"
      />
    </Transition>
  </div>
</template>

<style scoped>
/* Card shell */
.preview-card {
  box-shadow:
    0 1px 3px oklch(0 0 0 / 0.07),
    0 4px 12px oklch(0 0 0 / 0.05);
  border-color: var(--bs-border-color);
}

/* ── Thumbnail ─────────────────────── */
.thumb-col {
  position: relative;
  min-height: 180px;
}

.thumb-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.thumb-fallback {
  position: absolute;
  inset: 0;
  background: var(--bs-secondary-bg);
  color: var(--bs-secondary-color);
}

.thumb-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    transparent 50%,
    oklch(0 0 0 / 0.45) 100%
  );
  pointer-events: none;
}

/* Thumbnail overlay pills */
.thumb-pill {
  position: absolute;
  bottom: 10px;
  right: 10px;
  padding: 3px 8px;
  border-radius: 4px;
  background: oklch(0 0 0 / 0.72);
  color: #fff;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.025em;
  line-height: 1.5;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.thumb-pill--live {
  background: oklch(0.48 0.21 25 / 0.88);
}

.thumb-pill--tl {
  right: auto;
  left: 10px;
}

/* ── Tags (type + platform) ────────── */
.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  line-height: 1.5;
}

.tag--primary {
  background: color-mix(in oklch, var(--vh-primary) 12%, transparent);
  color: var(--vh-primary);
}

.tag--info {
  background: color-mix(in oklch, oklch(0.55 0.15 220) 12%, transparent);
  color: oklch(0.45 0.14 220);
}

.tag--live {
  background: color-mix(in oklch, var(--vh-primary) 15%, transparent);
  color: var(--vh-primary);
}

.tag--neutral {
  background: var(--bs-secondary-bg);
  color: var(--bs-secondary-color);
}

/* ── Info body ─────────────────────── */
.info-body {
  padding: 1.125rem 1.25rem;
  gap: 6px;
}

/* ── Title ─────────────────────────── */
.preview-title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.45;
  color: var(--bs-body-color);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── Channel ───────────────────────── */
.preview-channel {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 4px 0 0;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--bs-secondary-color);
  line-height: 1.3;
}

/* ── Stats ─────────────────────────── */
.stats-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 14px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid var(--bs-border-color);
}

.stat-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  color: var(--bs-secondary-color);
  line-height: 1;
}

/* ── Responsive ─────────────────────── */
@media (max-width: 767.98px) {
  .thumb-col {
    aspect-ratio: 16 / 9;
    min-height: unset;
  }

  .info-body {
    padding: 1rem;
  }
}

/* ── Transition ─────────────────────── */
.fade-up-enter-active {
  transition:
    opacity 220ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 220ms cubic-bezier(0.23, 1, 0.32, 1);
}

.fade-up-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

@media (prefers-reduced-motion: reduce) {
  .fade-up-enter-active { transition: opacity 150ms ease; }
  .fade-up-enter-from { transform: none; }
}
</style>
