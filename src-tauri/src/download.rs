use std::collections::HashMap;
use std::sync::Mutex;

use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;

#[derive(Default)]
pub struct ProcessRegistry(pub Mutex<HashMap<String, CommandChild>>);

#[derive(Clone, serde::Serialize)]
struct OutputPayload {
    id: String,
    line: String,
}

#[derive(Clone, serde::Serialize)]
struct DonePayload {
    id: String,
    code: Option<i32>,
}

pub fn run_sidecar(
    app: AppHandle,
    registry: tauri::State<'_, ProcessRegistry>,
    binary: &str,
    id: String,
    args: Vec<String>,
) -> Result<(), String> {
    let (mut rx, child) = app
        .shell()
        .sidecar(binary)
        .map_err(|e| e.to_string())?
        .args(args)
        .spawn()
        .map_err(|e| e.to_string())?;

    registry.0.lock().unwrap().insert(id.clone(), child);

    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(bytes) | CommandEvent::Stderr(bytes) => {
                    let line = String::from_utf8_lossy(&bytes).into_owned();
                    let _ = app.emit("sidecar://output", OutputPayload { id: id.clone(), line });
                }
                CommandEvent::Terminated(payload) => {
                    let _ = app.emit("sidecar://done", DonePayload { id: id.clone(), code: payload.code });
                    app.state::<ProcessRegistry>().0.lock().unwrap().remove(&id);
                    break;
                }
                _ => {}
            }
        }
    });

    Ok(())
}

/// Kill a running sidecar by id. No-op if it already finished.
pub fn cancel(registry: tauri::State<'_, ProcessRegistry>, id: &str) -> Result<(), String> {
    let child = registry.0.lock().unwrap().remove(id);
    if let Some(child) = child {
        child.kill().map_err(|e| e.to_string())?;
    }
    Ok(())
}
