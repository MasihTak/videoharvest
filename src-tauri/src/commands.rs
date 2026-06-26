use tauri::AppHandle;

use crate::download::{self, ProcessRegistry};

#[tauri::command]
pub fn run_ytdlp(
    app: AppHandle,
    registry: tauri::State<'_, ProcessRegistry>,
    id: String,
    args: Vec<String>,
) -> Result<(), String> {
    download::run_sidecar(app, registry, "binaries/yt-dlp", id, args)
}

#[tauri::command]
pub fn run_ffmpeg(
    app: AppHandle,
    registry: tauri::State<'_, ProcessRegistry>,
    id: String,
    args: Vec<String>,
) -> Result<(), String> {
    download::run_sidecar(app, registry, "binaries/ffmpeg", id, args)
}

#[tauri::command]
pub fn cancel_process(
    registry: tauri::State<'_, ProcessRegistry>,
    id: String,
) -> Result<(), String> {
    download::cancel(registry, &id)
}
