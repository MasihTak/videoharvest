import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export function runYtdlp(id, args) {
  return invoke("run_ytdlp", { id, args });
}

export function runFfmpeg(id, args) {
  return invoke("run_ffmpeg", { id, args });
}

export function cancelProcess(id) {
  return invoke("cancel_process", { id });
}

// handler receives { id, line }. Returns an unlisten() promise.
export function onOutput(handler) {
  return listen("sidecar://output", (event) => handler(event.payload));
}

// handler receives { id, code }. Returns an unlisten() promise.
export function onDone(handler) {
  return listen("sidecar://done", (event) => handler(event.payload));
}
