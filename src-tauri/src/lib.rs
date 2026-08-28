mod binaries;
mod commands;
mod db;
mod download;

/// Windows renders a toast only when the app's AppUserModelID is registered.
/// The NSIS installer is supposed to stamp it onto the Start Menu shortcut, but
/// skips that on upgrades, so register it here to cover every launch path.
#[cfg(windows)]
fn register_toast_app_id(app: &tauri::AppHandle) -> std::io::Result<()> {
    use tauri::Manager;
    use winreg::{enums::HKEY_CURRENT_USER, RegKey};

    let identifier = &app.config().identifier;
    let subkey = format!(r"Software\Classes\AppUserModelId\{identifier}");
    let (key, _) = RegKey::predef(HKEY_CURRENT_USER).create_subkey(subkey)?;
    key.set_value("DisplayName", &"VideoHarvest")?;

    if let Ok(resources) = app.path().resource_dir() {
        let icon = resources.join("icons/128x128.png");
        if icon.exists() {
            // The toast layer rejects the \\?\ extended-length prefix.
            let path = icon.to_string_lossy().replace(r"\\?\", "");
            key.set_value("IconUri", &path)?;
        }
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(db::DB_URL, db::migrations())
                .build(),
        )
        .setup(|_app| {
            // Best effort: a failed registry write must not block startup.
            #[cfg(windows)]
            let _ = register_toast_app_id(_app.handle());
            Ok(())
        })
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
