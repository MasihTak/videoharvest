// Managed yt-dlp + ffmpeg: first-run download, version, and self-update.

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export function binariesReady() {
  return invoke("binaries_ready");
}

export function bootstrapBinaries() {
  return invoke("bootstrap_binaries");
}

export function getYtdlpVersion() {
  return invoke("ytdlp_version");
}

export function updateYtdlp() {
  return invoke("update_ytdlp");
}

// handler receives { file, received, total }. Returns an unlisten() promise.
export function onBootstrapProgress(handler) {
  return listen("bootstrap://progress", (event) => handler(event.payload));
}

// Latest stable yt-dlp version tag from GitHub (e.g. "2025.06.01").
export async function checkLatestYtdlp() {
  const res = await fetch("https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest");
  if (!res.ok) throw new Error("Could not reach GitHub.");
  const data = await res.json();
  return data.tag_name;
}
