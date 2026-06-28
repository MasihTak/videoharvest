mod binaries;
mod commands;
mod db;
mod download;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(db::DB_URL, db::migrations())
                .build(),
        )
        .manage(download::ProcessRegistry::default())
        .invoke_handler(tauri::generate_handler![
            commands::run_ytdlp,
            commands::run_ffmpeg,
            commands::cancel_process,
            commands::binaries_ready,
            commands::bootstrap_binaries,
            commands::ytdlp_version,
            commands::update_ytdlp,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
