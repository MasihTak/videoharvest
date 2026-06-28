use tauri::AppHandle;

use crate::binaries;
use crate::download::{self, ProcessRegistry};

#[tauri::command]
pub fn run_ytdlp(
    app: AppHandle,
    registry: tauri::State<'_, ProcessRegistry>,
    id: String,
    mut args: Vec<String>,
) -> Result<(), String> {
    // Point yt-dlp at the managed ffmpeg so merges work without a system install.
    let ffmpeg = binaries::ffmpeg_path(&app)?;
    args.insert(0, "--ffmpeg-location".into());
    args.insert(1, ffmpeg.to_string_lossy().into_owned());

    let program = binaries::ytdlp_path(&app)?;
    download::run(app, registry, &program, id, args)
}

#[tauri::command]
pub fn run_ffmpeg(
    app: AppHandle,
    registry: tauri::State<'_, ProcessRegistry>,
    id: String,
    args: Vec<String>,
) -> Result<(), String> {
    let program = binaries::ffmpeg_path(&app)?;
    download::run(app, registry, &program, id, args)
}

#[tauri::command]
pub fn cancel_process(
    registry: tauri::State<'_, ProcessRegistry>,
    id: String,
) -> Result<(), String> {
    download::cancel(registry, &id)
}

#[tauri::command]
pub fn binaries_ready(app: AppHandle) -> Result<bool, String> {
    binaries::is_ready(&app)
}

#[tauri::command]
pub async fn bootstrap_binaries(app: AppHandle) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || binaries::bootstrap(&app))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub fn ytdlp_version(app: AppHandle) -> Result<String, String> {
    binaries::ytdlp_version(&app)
}

#[tauri::command]
pub async fn update_ytdlp(app: AppHandle) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || binaries::update_ytdlp(&app))
        .await
        .map_err(|e| e.to_string())?
}
